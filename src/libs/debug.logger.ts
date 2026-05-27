import { ConsoleLogger } from '@nestjs/common';

export class AppLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);

    console.log('🔥 ERROR LOG:', {
      message,
      stack,
      context,
    });
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
  }

  log(message: any, context?: string) {
    super.log(message, context);
  }
}
