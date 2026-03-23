import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class StreamZoneGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. If user.role !== CLASS_TEACHER → skip (let RolesGuard handle it)
    if (user.role !== UserRole.CLASS_TEACHER) {
      return true;
    }

    // 2. Extract form + stream from query params (or body for POST/PATCH)
    const form = request.query.form || request.body.form;
    const stream = request.query.stream || request.body.stream;

    // 3. Compare against req.user.assigned_form and req.user.assigned_stream
    if (form && stream) {
      if (
        user.assigned_form !== form ||
        user.assigned_stream !== stream
      ) {
        // 4. If mismatch → throw ForbiddenException
        throw new ForbiddenException('You can only access your assigned stream zone');
      }
    }

    return true;
  }
}
