import { Form } from '../../users/enums/user-role.enum';
import { Term } from '../enums/finance.enum';

export interface DeficitTrajectory {
  fee_structure_id: string;
  form: Form;
  term: Term;
  year: string;
  total_students: number;
  total_billed: number;
  total_exemptions: number;
  effective_billed: number;
  total_collected: number;
  collection_rate: number;
  daily_velocity: number;
  days_elapsed: number;
  days_remaining: number;
  projected_collection: number;
  projected_deficit: number;
  risk_level: 'low' | 'medium' | 'high';
  accounts_pending: number;
  accounts_partial: number;
  accounts_cleared: number;
  accounts_overpaid: number;
}
