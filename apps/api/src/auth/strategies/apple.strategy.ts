import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import AppleStrategy from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleAuthStrategy extends PassportStrategy(AppleStrategy, 'apple') {
  constructor(config: ConfigService, private auth: AuthService) {
    super({
      clientID: config.get('APPLE_CLIENT_ID'),
      teamID: config.get('APPLE_TEAM_ID'),
      keyID: config.get('APPLE_KEY_ID'),
      privateKeyString: (config.get<string>('APPLE_PRIVATE_KEY') || '').replace(/\\n/g, '\n'),
      callbackURL: config.get('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
      passReqToCallback: false,
    });
  }

  async validate(accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) {
    try {
      const email = idToken?.email || profile?.email;
      const firstName = profile?.name?.firstName || '';
      const lastName = profile?.name?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || email?.split('@')[0] || 'Apple User';
      const providerId = idToken?.sub || profile?.id;

      const user = await this.auth.findOrCreateOAuthUser({ email, fullName, provider: 'apple', providerId });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
}
