import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Aquí podríamos añadir lógica personalizada antes de la validación JWT
    return super.canActivate(context);
  }
}
