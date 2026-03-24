import { UserRole, Form, Stream } from '../../users/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  assigned_form?: Form;
  assigned_stream?: Stream;
}
