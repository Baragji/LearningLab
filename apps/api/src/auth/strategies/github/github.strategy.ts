// apps/api/src/auth/strategies/github/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Profile } from 'passport';
import { AuthService } from '../../auth.service';
import { AuthProvider } from '@repo/core';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('socialAuth.github.clientID'),
      clientSecret: configService.get('socialAuth.github.clientSecret'),
      callbackURL: configService.get('socialAuth.github.callbackURL'),
      scope: configService.get('socialAuth.github.scope'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, displayName, emails, photos } = profile;

    // GitHub kan returnere flere emails, vi bruger den første (typisk den primære)
    const primaryEmail = emails?.[0]?.value;

    if (!primaryEmail) {
      throw new Error('Kunne ikke hente email fra GitHub profil');
    }

    const user = await this.authService.validateSocialUser({
      providerId: id,
      provider: AuthProvider.GITHUB,
      email: primaryEmail,
      name: displayName || 'GitHub Bruger',
      profileImage: photos?.[0]?.value,
    });

    return user;
  }
}
