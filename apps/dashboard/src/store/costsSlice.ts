import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CostEvent {
  user: string;
  dept: string;
  amount: number;
  trend: string;
  delta: number;
  stats: { company: number; dept: number; emp: number };
}

interface BudgetState {
  history: CostEvent[];
  activeTab: 'company' | 'dept' | 'emp';
}

const initialState: BudgetState = {
  history: [],
  activeTab: 'company',
};

export const costsSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    addEvent: (state, action: PayloadAction<CostEvent>) => {
      // Logic: Add to front of history
      state.history.unshift(action.payload);
      // Keep only last 100 for performance
      if (state.history.length > 100) state.history.pop();
    },
    setTab: (state, action: PayloadAction<'company' | 'dept' | 'emp'>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { addEvent, setTab } = costsSlice.actions;
export default costsSlice.reducer;