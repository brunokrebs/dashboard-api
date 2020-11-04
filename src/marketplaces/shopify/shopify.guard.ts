import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { raw } from 'express';
import { Observable } from 'rxjs';
import crypto from 'crypto';

@Injectable()
export class ShopifyGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const hmacShopify = req.get('x-shopify-hmac-sha256');

    const rawBody: Buffer = req.body;
    const digest = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_VALIDATOR)
      .update(rawBody)
      .digest('base64');

    return hmacShopify === digest;
  }
}
