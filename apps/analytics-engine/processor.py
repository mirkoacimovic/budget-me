import pika
import json
import sqlite3
import os
import sys
import time

# Configuration from environment
DB_PATH = os.getenv('DB_PATH', '/app/data/budget.db')
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')

def init_db():
    """Ensures the data directory and SQLite table exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cost_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            department TEXT NOT NULL,
            firstName TEXT NOT NULL,
            lastName TEXT,
            description TEXT,
            amount REAL DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.close()

def seed_data():
    """Seeds the initial target balance of $46,750 if the table is empty."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM cost_records")
    if cursor.fetchone()[0] == 0:
        print("🌱 Seeding initial balance: $46,750.00")
        cursor.execute("""
            INSERT INTO cost_records (company, department, firstName, lastName, description, amount) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, ('BudgetCorp', 'Finance', 'System', 'Seed', 'Initial Balance', 46750.0))
        conn.commit()
    conn.close()

def calculate_velocity(amount, dept):
    """Calculates % change vs the average of the last 10 records for the department."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT AVG(amount) FROM (
            SELECT amount FROM cost_records 
            WHERE department = ? 
            ORDER BY timestamp DESC LIMIT 10
        )
    """, (dept,))
    row = cursor.fetchone()
    avg = row[0] if row else None
    conn.close()
    return round(((amount - avg) / avg) * 100, 1) if avg and avg > 0 else 0.0

def get_stats(dept, user):
    """Retrieves rolling sums for Company, Department, and Employee."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount) FROM cost_records")
    glob = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(amount) FROM cost_records WHERE department = ?", (dept,))
    sec = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(amount) FROM cost_records WHERE firstName = ?", (user,))
    unt = cursor.fetchone()[0] or 0
    conn.close()
    return {"company": round(glob, 2), "dept": round(sec, 2), "emp": round(unt, 2)}

def callback(ch, method, properties, body):
    """Processes incoming RabbitMQ messages and publishes results back to NestJS."""
    try:
        data = json.loads(body)
        # NestJS sends data inside a 'data' key by default
        payload = data.get('data', data)
        
        amt = payload.get('amount')
        dept = payload.get('department')
        user = payload.get('firstName')
        
        if not amt or not dept or not user:
            return

        vel = calculate_velocity(amt, dept)
        
        # Persist the new record
        conn = sqlite3.connect(DB_PATH)
        conn.execute("""
            INSERT INTO cost_records (company, department, firstName, lastName, description, amount) 
            VALUES (?,?,?,?,?,?)
        """, (payload.get('company'), dept, user, payload.get('lastName'), payload.get('description'), amt))
        conn.commit()
        conn.close()

        # Construct the result for the AI Results Exchange
        # NestJS expects this JSON structure to trigger @EventPattern('ai_result')
        result = {
            "stats": get_stats(dept, user), 
            "amount": amt, 
            "user": user, 
            "dept": dept, 
            "delta": vel
        }
        
        ch.basic_publish(
            exchange='ai_results_exchange', 
            routing_key='', 
            body=json.dumps({"pattern": "ai_result", "data": result})
        )
        print(f" [✓] Processed {user} - ${amt}")
    except Exception as e:
        print(f" [!] Error in callback: {e}")

def main():
    init_db()
    seed_data()
    
    connection = None
    print(f' [*] Waiting for RabbitMQ at {RABBITMQ_HOST}...')
    
    for attempt in range(1, 11):
        try:
            # Using simple host connection for consistency with your env
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
            break 
        except Exception:
            print(f" [!] RabbitMQ not ready (Attempt {attempt}/10). Retrying in 5s...")
            time.sleep(5)

    if not connection:
        print(" [✘] Failed to connect to RabbitMQ. Exiting.")
        sys.exit(1)

    try:
        ch = connection.channel()
        # Declare the queues and exchanges to match the Plumbing phase
        ch.queue_declare(queue='cost_queue', durable=True)
        ch.exchange_declare(exchange='ai_results_exchange', exchange_type='fanout', durable=True)
        
        ch.basic_consume(queue='cost_queue', on_message_callback=callback, auto_ack=True)
        print(' [🚀] Worker Online. Ready for telemetry...')
        ch.start_consuming()
    except Exception as e:
        print(f" [!] Runtime Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()