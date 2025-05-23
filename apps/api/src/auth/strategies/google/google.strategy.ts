// apps/api/src/auth/strategies/google/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Profile } from 'passport';
import { AuthService } from '../../auth.service';
import { AuthProvider } from '@repo/core';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('socialAuth.google.clientID'),
      clientSecret: configService.get('socialAuth.google.clientSecret'),
      callbackURL: configService.get('socialAuth.google.callbackURL'),
      scope: configService.get('socialAuth.google.scope'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, name, emails, photos } = profile;

    const user = await this.authService.validateSocialUser({
      providerId: id,
      provider: AuthProvider.GOOGLE,
      email: emails[0].value,
      name: name.givenName + ' ' + name.familyName,
      profileImage: photos[0]?.value,
    });

    return user;
  }
}
