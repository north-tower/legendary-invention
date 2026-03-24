import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class StreamZoneGuard implements CanActivate {
  private readonly logger = new Logger(StreamZoneGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.error('No user found in request');
      return false;
    }

    // 1. If user.role !== CLASS_TEACHER → skip (let RolesGuard handle it)
    if (user.role !== UserRole.CLASS_TEACHER) {
      return true;
    }

    // 2. Extract form + stream from query params (or body for POST/PATCH)
    const form = request.query.form || request.body.form;
    const stream = request.query.stream || request.body.stream;

    this.logger.debug(`Checking access for Teacher ${user.email}. Request: Form=${form}, Stream=${stream}. Assigned: Form=${user.assigned_form}, Stream=${user.assigned_stream}`);

    // 3. Compare against req.user.assigned_form and req.user.assigned_stream
    if (form && stream) {
      if (
        String(user.assigned_form) !== String(form) ||
        String(user.assigned_stream) !== String(stream)
      ) {
        // 4. If mismatch → throw ForbiddenException
        this.logger.warn(`Forbidden access attempt by ${user.email}: Request(${form}, ${stream}) vs Assigned(${user.assigned_form}, ${user.assigned_stream})`);
        throw new ForbiddenException('You can only access your assigned stream zone');
      }
    }

    return true;
  }
}
