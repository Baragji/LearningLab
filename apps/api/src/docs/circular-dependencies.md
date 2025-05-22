# Håndtering af cirkulære afhængigheder i LearningLab

Dette dokument beskriver, hvordan vi har løst cirkulære afhængigheder i LearningLab-projektet, specifikt mellem `AuthModule` og `UsersModule`.

## Problemet med cirkulære afhængigheder

Cirkulære afhængigheder opstår, når to eller flere moduler er afhængige af hinanden, enten direkte eller indirekte. For eksempel:

- `AuthModule` importerer `UsersModule` for at bruge `UsersService` til brugervalidering
- `UsersModule` importerer `AuthModule` for at bruge `AuthService` til token-validering

Dette skaber en cirkulær afhængighed: A → B → A

## Løsninger implementeret i projektet

Vi har implementeret flere strategier til at løse cirkulære afhængigheder:

### 1. Brug af `forwardRef()`

NestJS tilbyder `forwardRef()` funktionen, der tillader cirkulære afhængigheder ved at "fremadreference" en afhængighed, der endnu ikke er defineret.

**Eksempel:**

```typescript
// auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule), // Brug forwardRef for at undgå cirkulære afhængigheder
    // ...
  ],
})
export class AuthModule {}
```

```typescript
// users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule), // Brug forwardRef for at undgå cirkulære afhængigheder
    // ...
  ],
})
export class UsersModule {}
```

Ved injektion af services:

```typescript
// auth.service.ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    // ...
  ) {}
}
```

### 2. Udtrække fælles funktionalitet til en `SharedModule`

Vi har oprettet en `SharedModule`, der indeholder fælles funktionalitet, som kan bruges af flere moduler. Dette reducerer behovet for direkte afhængigheder mellem moduler.

**Eksempel:**

```typescript
// shared.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class SharedModule {}
```

Både `AuthModule` og `UsersModule` kan nu importere `SharedModule` i stedet for at være direkte afhængige af hinanden.

### 3. Dependency Inversion (ikke implementeret endnu)

En tredje tilgang er at bruge Dependency Inversion-princippet, hvor moduler afhænger af abstraktioner (interfaces) i stedet for konkrete implementeringer.

Dette kunne implementeres ved at definere interfaces for services og bruge custom providers i NestJS.

## Verifikation

For at verificere, at cirkulære afhængigheder er løst, kan du:

1. Kør applikationen og se, om der er advarsler om cirkulære afhængigheder i konsoloutputtet
2. Kør tests for at sikre, at alt fungerer som forventet
3. Kør lint-checks for at fange eventuelle problemer

## Best Practices

- Brug `forwardRef()` kun når det er nødvendigt, da det kan gøre koden sværere at forstå
- Overvej altid, om du kan omstrukturere din kode for at undgå cirkulære afhængigheder
- Udnyt `SharedModule` til at isolere fælles funktionalitet
- Dokumentér dine løsninger, så andre udviklere forstår arkitekturen