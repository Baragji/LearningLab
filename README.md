
```
LearningLab
├─ .idea
│  ├─ LearningLab.iml
│  ├─ caches
│  ├─ dictionaries
│  │  └─ project.xml
│  ├─ inspectionProfiles
│  │  └─ Project_Default.xml
│  ├─ jsLibraryMappings.xml
│  ├─ misc.xml
│  ├─ modules.xml
│  ├─ prettier.xml
│  ├─ runConfigurations
│  │  ├─ Jest.xml
│  │  ├─ Playwright.xml
│  │  └─ Turborepo_dev.xml
│  ├─ vcs.xml
│  ├─ webResources.xml
│  └─ workspace.xml
├─ .junie
│  └─ oldguide.md
├─ .node-version
├─ .repomix
│  └─ bundles.json
├─ .yarn
│  ├─ install-state.gz
│  └─ releases
│     └─ yarn-4.9.1.cjs
├─ .yarnrc.yml
├─ .zencoder
│  ├─ README.md
│  ├─ Zencoder-0837ecf2-4b3a-4238-bfe4-1f84df721a3e.log
│  ├─ Zencoder-2ac4afe0-89a3-400b-a40d-f529bf91cea0.log
│  ├─ Zencoder-44afc8d1-79e5-40fd-8b74-e085754f3965.log
│  ├─ Zencoder-4abb949c-a65e-4693-aec7-f9c53a842410.log
│  ├─ Zencoder-575c2f9d-8546-40a1-a2aa-b7c395461b84.log
│  ├─ Zencoder-5c00a04a-5718-4bae-b774-10b85f0001b8.log
│  ├─ Zencoder-5c7fef70-251f-42ee-baa5-697e49dd529d.log
│  ├─ Zencoder-a486f42b-0441-41ad-845b-1c18641dc510.log
│  ├─ Zencoder-e1e64256-787a-45ac-bdde-3440d5e8598e.log
│  ├─ Zencoder-ed724e50-0f12-4991-8900-bdd37479bcab.log
│  ├─ backups
│  │  └─ apps
│  │     └─ api
│  │        └─ src
│  │           └─ config
│  │              └─ node-version.spec.ts.backup
│  └─ cleanup.sh
├─ .zencoder_backup
├─ Dockerfile.api
├─ Dockerfile.web
├─ E1-MVP-UI-Plan.md
├─ Jira style.txt
├─ LICENSE
├─ Optimering.txt
├─ Plan.txt
├─ Seedpensum.txt
├─ Vision&brainstom.txt
├─ api
│  └─ web.txt
├─ apps
│  ├─ api
│  │  ├─ .eslintrc.js
│  │  ├─ .prettierrc
│  │  ├─ docs
│  │  │  └─ migration-strategy.md
│  │  ├─ nest-cli.json
│  │  ├─ package.json
│  │  ├─ prisma
│  │  │  ├─ migrations
│  │  │  │  ├─ 20220307034109_initial_migrate
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250517073440_add_user_auth_fields
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250517122525_add_password_reset_fields
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250520211803_add_pensum_and_quiz_models
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250523165258_created_by
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250523172339_add_advanced_search_fields
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250523173305_add_user_profile_fields
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250523200842_add_xp_to_user
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250523220919_new
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250524003326_add_content_block_types
│  │  │  │  │  └─ migration.sql
│  │  │  │  ├─ 20250524220309_add_advanced_quiz_functionality
│  │  │  │  │  └─ migration.sql
│  │  │  │  └─ migration_lock.toml
│  │  │  ├─ schema.prisma
│  │  │  └─ seed.ts
│  │  ├─ src
│  │  │  ├─ README.md
│  │  │  ├─ app.controller.spec.ts
│  │  │  ├─ app.controller.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ app.service.ts
│  │  │  ├─ auth
│  │  │  │  ├─ auth.controller.ts
│  │  │  │  ├─ auth.module.ts
│  │  │  │  ├─ auth.service.ts
│  │  │  │  ├─ decorators
│  │  │  │  │  ├─ current-user.decorator.ts
│  │  │  │  │  └─ roles.decorator.ts
│  │  │  │  ├─ dto
│  │  │  │  │  ├─ forgot-password.dto.ts
│  │  │  │  │  ├─ login.dto.ts
│  │  │  │  │  ├─ refresh-token.dto.ts
│  │  │  │  │  ├─ reset-password.dto.ts
│  │  │  │  │  └─ social-user.dto.ts
│  │  │  │  ├─ guards
│  │  │  │  │  ├─ github-auth.guard.ts
│  │  │  │  │  ├─ google-auth.guard.ts
│  │  │  │  │  ├─ jwt-auth.guard.ts
│  │  │  │  │  ├─ local-auth.guard.ts
│  │  │  │  │  ├─ login-throttler.guard.ts
│  │  │  │  │  ├─ optional-jwt-auth.guard.ts
│  │  │  │  │  └─ roles.guard.ts
│  │  │  │  └─ strategies
│  │  │  │     ├─ github
│  │  │  │     │  └─ github.strategy.ts
│  │  │  │     ├─ google
│  │  │  │     │  └─ google.strategy.ts
│  │  │  │     ├─ jwt
│  │  │  │     │  └─ jwt.ts
│  │  │  │     └─ local
│  │  │  │        └─ local.ts
│  │  │  ├─ common
│  │  │  │  ├─ common.module.ts
│  │  │  │  ├─ filters
│  │  │  │  │  └─ global-exception.filter.ts
│  │  │  │  ├─ interceptors
│  │  │  │  │  ├─ custom-cache.interceptor.ts
│  │  │  │  │  └─ simple-cache.interceptor.ts
│  │  │  │  ├─ middleware
│  │  │  │  │  ├─ cache-logger.middleware.ts
│  │  │  │  │  ├─ csrf.middleware.ts
│  │  │  │  │  └─ user-identification.middleware.ts
│  │  │  │  ├─ pipes
│  │  │  │  │  └─ zod-validation.pipe.ts
│  │  │  │  └─ services
│  │  │  │     ├─ base.service.ts
│  │  │  │     └─ logger.service.ts
│  │  │  ├─ config
│  │  │  │  ├─ app.config.ts
│  │  │  │  ├─ auth.config.ts
│  │  │  │  ├─ cache.config.ts
│  │  │  │  ├─ config.module.ts
│  │  │  │  ├─ config.service.ts
│  │  │  │  ├─ cors.config.ts
│  │  │  │  ├─ environment-variables.ts
│  │  │  │  ├─ error-handling.config.ts
│  │  │  │  ├─ node-version.spec.ts
│  │  │  │  ├─ social-auth.config.ts
│  │  │  │  └─ throttle.config.ts
│  │  │  ├─ controllers
│  │  │  │  ├─ certificate.controller.ts
│  │  │  │  ├─ certificate.module.ts
│  │  │  │  ├─ contentBlock.controller.nest.ts
│  │  │  │  ├─ contentBlock.controller.ts
│  │  │  │  ├─ contentBlocks.module.ts
│  │  │  │  ├─ course.controller.nest.ts
│  │  │  │  ├─ course.controller.ts
│  │  │  │  ├─ courses.module.ts
│  │  │  │  ├─ dto
│  │  │  │  │  ├─ certificate
│  │  │  │  │  │  └─ certificate.dto.ts
│  │  │  │  │  ├─ contentBlock
│  │  │  │  │  │  └─ contentBlock.dto.ts
│  │  │  │  │  ├─ course.dto.ts
│  │  │  │  │  ├─ lesson
│  │  │  │  │  │  └─ lesson.dto.ts
│  │  │  │  │  ├─ module
│  │  │  │  │  │  └─ module.dto.ts
│  │  │  │  │  ├─ pensum
│  │  │  │  │  │  └─ pensum.dto.ts
│  │  │  │  │  ├─ question-bank
│  │  │  │  │  │  └─ question-bank.dto.ts
│  │  │  │  │  ├─ quiz
│  │  │  │  │  │  ├─ answerOption.dto.ts
│  │  │  │  │  │  ├─ question.dto.ts
│  │  │  │  │  │  └─ quiz.dto.ts
│  │  │  │  │  ├─ quiz-attempt
│  │  │  │  │  │  └─ quiz-attempt.dto.ts
│  │  │  │  │  ├─ subject-area
│  │  │  │  │  │  └─ subject-area.dto.ts
│  │  │  │  │  └─ user-progress
│  │  │  │  │     └─ user-progress.dto.ts
│  │  │  │  ├─ error-test.controller.ts
│  │  │  │  ├─ lesson.controller.nest.ts
│  │  │  │  ├─ lesson.controller.ts
│  │  │  │  ├─ lessons.module.ts
│  │  │  │  ├─ module.controller.nest.ts
│  │  │  │  ├─ module.controller.ts
│  │  │  │  ├─ modules.module.ts
│  │  │  │  ├─ pensum.controller.nest.ts
│  │  │  │  ├─ pensum.controller.ts
│  │  │  │  ├─ pensum.module.ts
│  │  │  │  ├─ question-bank.controller.ts
│  │  │  │  ├─ question-bank.module.ts
│  │  │  │  ├─ questionBank.controller.ts
│  │  │  │  ├─ quiz.controller.nest.ts
│  │  │  │  ├─ quiz.controller.ts
│  │  │  │  ├─ quizAttempt.controller.nest.ts
│  │  │  │  ├─ quizAttempt.controller.ts
│  │  │  │  ├─ quizAttempts.module.ts
│  │  │  │  ├─ quizzes.module.ts
│  │  │  │  ├─ services
│  │  │  │  │  └─ subject-area.service.ts
│  │  │  │  ├─ subjectArea.controller.nest.ts
│  │  │  │  ├─ subjectArea.controller.nest.updated.ts
│  │  │  │  ├─ subjectArea.controller.ts
│  │  │  │  ├─ subjectAreas.module.ts
│  │  │  │  ├─ userProgress.controller.nest.ts
│  │  │  │  ├─ userProgress.controller.ts
│  │  │  │  └─ userProgress.module.ts
│  │  │  ├─ create-test-data.ts
│  │  │  ├─ docs
│  │  │  │  └─ circular-dependencies.md
│  │  │  ├─ dto
│  │  │  │  └─ update-lesson-progress.dto.ts
│  │  │  ├─ main.ts
│  │  │  ├─ middleware
│  │  │  │  └─ auth.middleware.ts
│  │  │  ├─ modules
│  │  │  │  ├─ pensum.module.ts
│  │  │  │  ├─ quiz.module.ts
│  │  │  │  └─ userProgress.module.ts
│  │  │  ├─ persistence
│  │  │  │  ├─ persistence.module.ts
│  │  │  │  └─ prisma
│  │  │  │     ├─ prisma.module.ts
│  │  │  │     ├─ prisma.service.spec.ts
│  │  │  │     └─ prisma.service.ts
│  │  │  ├─ quiz
│  │  │  │  └─ dto
│  │  │  │     └─ update-quiz-progress.dto.ts
│  │  │  ├─ search
│  │  │  │  ├─ search.controller.ts
│  │  │  │  ├─ search.module.ts
│  │  │  │  └─ search.service.ts
│  │  │  ├─ services
│  │  │  │  ├─ pensum.service.ts
│  │  │  │  ├─ question-import.service.ts
│  │  │  │  ├─ quiz.service.ts
│  │  │  │  └─ userProgress.service.ts
│  │  │  ├─ shared
│  │  │  │  └─ shared.module.ts
│  │  │  ├─ test-content-block-types.ts
│  │  │  ├─ test-json-validation.ts
│  │  │  ├─ test-quiz-fields.ts
│  │  │  ├─ types
│  │  │  │  └─ express.d.ts
│  │  │  ├─ user-groups
│  │  │  │  ├─ dto
│  │  │  │  │  ├─ add-users-to-group.dto.ts
│  │  │  │  │  ├─ create-user-group.dto.ts
│  │  │  │  │  └─ update-user-group.dto.ts
│  │  │  │  ├─ user-groups.controller.ts
│  │  │  │  ├─ user-groups.module.ts
│  │  │  │  └─ user-groups.service.ts
│  │  │  └─ users
│  │  │     ├─ dto
│  │  │     │  ├─ bulk-delete-users.dto.ts
│  │  │     │  ├─ bulk-get-users.dto.ts
│  │  │     │  ├─ bulk-invite-users.dto.ts
│  │  │     │  ├─ create-user.dto.ts
│  │  │     │  └─ update-user.dto.ts
│  │  │     ├─ schemas
│  │  │     │  ├─ social-links.schema.ts
│  │  │     │  └─ user-settings.schema.ts
│  │  │     ├─ users.controller.spec.ts
│  │  │     ├─ users.controller.ts
│  │  │     ├─ users.module.ts
│  │  │     ├─ users.service.spec.ts
│  │  │     └─ users.service.ts
│  │  ├─ test
│  │  │  ├─ app.e2e-spec.ts
│  │  │  ├─ config
│  │  │  │  └─ node-version.spec.ts
│  │  │  └─ jest-e2e.json
│  │  ├─ tsconfig.json
│  │  └─ webpack-hmr.config.js
│  └─ web
│     ├─ .eslintrc.js
│     ├─ .swc
│     │  └─ plugins
│     │     └─ v7_macos_aarch64_0.98.5
│     ├─ README.md
│     ├─ app
│     │  ├─ admin
│     │  │  ├─ groups
│     │  │  │  └─ [id]
│     │  │  │     └─ page.tsx
│     │  │  └─ users
│     │  │     ├─ [id]
│     │  │     │  └─ page.tsx
│     │  │     └─ page.tsx
│     │  └─ search
│     │     └─ page.tsx
│     ├─ e2e
│     │  ├─ login.spec.ts
│     │  └─ register.spec.ts
│     ├─ jest.config.js
│     ├─ jest.setup.js
│     ├─ next-env.d.ts
│     ├─ next.config.js
│     ├─ package.json
│     ├─ pages
│     │  ├─ _app.tsx
│     │  ├─ admin
│     │  │  ├─ courses
│     │  │  │  ├─ create.tsx
│     │  │  │  ├─ edit
│     │  │  │  │  └─ [id].tsx
│     │  │  │  └─ index.tsx
│     │  │  ├─ index.tsx
│     │  │  ├─ modules
│     │  │  │  ├─ create.tsx
│     │  │  │  ├─ edit
│     │  │  │  │  └─ [id].tsx
│     │  │  │  └─ index.tsx
│     │  │  ├─ user-groups
│     │  │  │  └─ index.tsx
│     │  │  └─ users
│     │  │     ├─ assign-to-course.tsx
│     │  │     ├─ edit
│     │  │     │  └─ [id].tsx
│     │  │     └─ invite.tsx
│     │  ├─ courses
│     │  │  ├─ [slug]
│     │  │  │  └─ quizzes
│     │  │  │     ├─ [id]
│     │  │  │     │  └─ results.tsx
│     │  │  │     └─ [id].tsx
│     │  │  ├─ [slug].tsx
│     │  │  └─ index.tsx
│     │  ├─ dashboard.tsx
│     │  ├─ forgot-password.tsx
│     │  ├─ index.tsx
│     │  ├─ lessons
│     │  │  └─ [id].tsx
│     │  ├─ login.tsx
│     │  ├─ my-courses.tsx
│     │  ├─ profile.tsx
│     │  ├─ quiz
│     │  │  └─ [id].tsx
│     │  ├─ reset-password.tsx
│     │  ├─ settings.tsx
│     │  ├─ signup.tsx
│     │  ├─ statistics.tsx
│     │  └─ ui-examples.tsx
│     ├─ playwright-report
│     │  └─ index.html
│     ├─ playwright.config.ts
│     ├─ postcss.config.js
│     ├─ src
│     │  ├─ common
│     │  ├─ components
│     │  │  ├─ auth
│     │  │  ├─ common
│     │  │  │  ├─ OfflineIndicator.tsx
│     │  │  │  └─ UIExamples.tsx
│     │  │  ├─ content
│     │  │  │  └─ ContentBlockRenderer.tsx
│     │  │  ├─ quiz
│     │  │  │  ├─ IncorrectAnswersList.tsx
│     │  │  │  ├─ OfflineQuizNotification.tsx
│     │  │  │  ├─ QuizContainer.tsx
│     │  │  │  ├─ QuizNavigation.tsx
│     │  │  │  ├─ QuizProgress.tsx
│     │  │  │  ├─ QuizQuestion.tsx
│     │  │  │  ├─ RadialProgress.tsx
│     │  │  │  └─ ScoreToast.tsx
│     │  │  └─ ui
│     │  │     ├─ AppButton.tsx
│     │  │     ├─ badge.tsx
│     │  │     ├─ card.tsx
│     │  │     ├─ checkbox.tsx
│     │  │     ├─ dialog.tsx
│     │  │     ├─ input.tsx
│     │  │     ├─ label.tsx
│     │  │     ├─ select.tsx
│     │  │     ├─ separator.tsx
│     │  │     ├─ table.tsx
│     │  │     ├─ tabs.tsx
│     │  │     └─ textarea.tsx
│     │  ├─ context
│     │  │  ├─ AuthContext.tsx
│     │  │  ├─ ProgressContext.tsx
│     │  │  ├─ QuizContext.tsx
│     │  │  ├─ ThemeContext.tsx
│     │  │  ├─ index.ts
│     │  │  └─ useAuth.ts
│     │  ├─ contexts
│     │  │  ├─ AuthContext.tsx
│     │  │  ├─ ProgressContext.tsx
│     │  │  ├─ QuizContext.tsx
│     │  │  ├─ ThemeContext.tsx
│     │  │  └─ useAuth.ts
│     │  ├─ hooks
│     │  │  ├─ useOfflineStatus.ts
│     │  │  └─ useQuizProgress.ts
│     │  ├─ lib
│     │  │  └─ utils.ts
│     │  ├─ screens
│     │  │  ├─ admin
│     │  │  ├─ auth
│     │  │  │  ├─ forgot-password
│     │  │  │  │  └─ forgot-password.tsx
│     │  │  │  ├─ login
│     │  │  │  │  ├─ login.test.tsx
│     │  │  │  │  └─ login.tsx
│     │  │  │  ├─ reset-password
│     │  │  │  │  └─ reset-password.tsx
│     │  │  │  └─ signup
│     │  │  │     └─ signup.tsx
│     │  │  ├─ common
│     │  │  │  ├─ CoursePage.tsx
│     │  │  │  ├─ DashboardPage.tsx
│     │  │  │  ├─ LessonPage.tsx
│     │  │  │  ├─ ModulePage.tsx
│     │  │  │  ├─ QuizPage.tsx
│     │  │  │  ├─ UserProfilePage.tsx
│     │  │  │  └─ index.ts
│     │  │  └─ employee
│     │  ├─ services
│     │  │  ├─ apiClient.ts
│     │  │  └─ userProgressApi.ts
│     │  ├─ store
│     │  │  ├─ index.ts
│     │  │  └─ services
│     │  │     └─ api.ts
│     │  ├─ styles
│     │  │  └─ global.css
│     │  └─ utils
│     │     └─ offlineSync.ts
│     ├─ tailwind.config.js
│     ├─ test-results
│     │  └─ .last-run.json
│     └─ tsconfig.json
├─ cleanup.sh
├─ code-review-issues.md
├─ docker-compose.yml
├─ docker-deployment-guide.md
├─ docs
│  ├─ deployment
│  │  ├─ README.md
│  │  ├─ ci-cd-secrets-guide.md
│  │  ├─ ci-cd-troubleshooting-guide.md
│  │  ├─ deployment-alignment-guide.md
│  │  └─ environment-deployment-guide.md
│  ├─ mui-theme-documentation.md
│  ├─ ui-audit.md
│  ├─ ui-component-library.md
│  ├─ ui-konsolidering-fase1-opsummering.md
│  ├─ ui-konsolidering-fase2-plan.md
│  ├─ ui-konsolidering-plan.md
│  └─ ui-migration-guide.md
├─ envfiler.txt
├─ guidelines-alignment-plan.md
├─ guidelines.md
├─ implementation-plan.md
├─ implementation-plan.txt
├─ improvement-plan.md
├─ interaktivsprint.html
├─ milesten.txt
├─ nginx.conf
├─ package-scripts.js
├─ package.json
├─ packages
│  ├─ config
│  │  ├─ .eslintrc.js
│  │  ├─ eslint-preset.js
│  │  ├─ nginx.conf
│  │  ├─ package.json
│  │  ├─ postcss.config.js
│  │  ├─ src
│  │  │  ├─ env.d.ts
│  │  │  ├─ env.d.ts.map
│  │  │  ├─ env.js
│  │  │  ├─ env.js.map
│  │  │  ├─ env.ts
│  │  │  ├─ index.d.ts
│  │  │  ├─ index.d.ts.map
│  │  │  ├─ index.js
│  │  │  ├─ index.js.map
│  │  │  └─ index.ts
│  │  ├─ tailwind.config.js
│  │  └─ tsconfig.json
│  ├─ core
│  │  ├─ .eslintrc.js
│  │  ├─ jest.config.js
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ index.d.ts
│  │  │  ├─ index.d.ts.map
│  │  │  ├─ index.js
│  │  │  ├─ index.js.map
│  │  │  ├─ index.ts
│  │  │  ├─ types
│  │  │  │  ├─ pensum.types.d.ts
│  │  │  │  ├─ pensum.types.d.ts.map
│  │  │  │  ├─ pensum.types.js
│  │  │  │  ├─ pensum.types.js.map
│  │  │  │  ├─ pensum.types.ts
│  │  │  │  ├─ quiz.types.d.ts
│  │  │  │  ├─ quiz.types.d.ts.map
│  │  │  │  ├─ quiz.types.js
│  │  │  │  ├─ quiz.types.js.map
│  │  │  │  ├─ quiz.types.ts
│  │  │  │  ├─ user.types.d.ts
│  │  │  │  ├─ user.types.d.ts.map
│  │  │  │  ├─ user.types.js
│  │  │  │  ├─ user.types.js.map
│  │  │  │  ├─ user.types.test.ts
│  │  │  │  └─ user.types.ts
│  │  │  └─ utils
│  │  │     ├─ validation.test.ts
│  │  │     └─ validation.ts
│  │  └─ tsconfig.json
│  ├─ create-solid-wow
│  │  ├─ .eslintrc.js
│  │  ├─ package.json
│  │  ├─ src
│  │  │  └─ index.ts
│  │  └─ tsconfig.json
│  ├─ tsconfig
│  │  ├─ README.md
│  │  ├─ base.json
│  │  ├─ nestjs.json
│  │  ├─ nextjs.json
│  │  ├─ package.json
│  │  └─ react-library.json
│  └─ ui
│     ├─ .eslintrc.js
│     ├─ components
│     │  ├─ Button
│     │  │  ├─ Button.test.tsx
│     │  │  └─ Button.tsx
│     │  ├─ Notification
│     │  │  ├─ Notification.test.tsx
│     │  │  ├─ Notification.tsx
│     │  │  ├─ NotificationProvider.test.tsx
│     │  │  └─ NotificationProvider.tsx
│     │  ├─ Skeleton
│     │  │  ├─ Skeleton.test.tsx
│     │  │  └─ Skeleton.tsx
│     │  └─ mui
│     │     ├─ Alert
│     │     ├─ Button
│     │     │  ├─ Button.test.tsx
│     │     │  ├─ Button.tsx
│     │     │  └─ index.ts
│     │     ├─ Card
│     │     ├─ Checkbox
│     │     │  ├─ Checkbox.test.tsx
│     │     │  ├─ Checkbox.tsx
│     │     │  ├─ README.md
│     │     │  └─ index.ts
│     │     ├─ Dialog
│     │     ├─ Select
│     │     │  ├─ README.md
│     │     │  ├─ Select.test.tsx
│     │     │  ├─ Select.tsx
│     │     │  └─ index.ts
│     │     ├─ Table
│     │     ├─ Tabs
│     │     ├─ TextField
│     │     │  ├─ README.md
│     │     │  ├─ TextField.test.tsx
│     │     │  ├─ TextField.tsx
│     │     │  └─ index.ts
│     │     ├─ index.ts
│     │     └─ test-utils.tsx
│     ├─ index.tsx
│     ├─ jest.config.js
│     ├─ jest.setup.js
│     ├─ package.json
│     ├─ theme
│     │  └─ index.ts
│     ├─ tsconfig.json
│     └─ utils
│        └─ cn.ts
├─ planfordeub
├─ prisma
│  ├─ migrations
│  │  ├─ 20250520183549_new
│  │  │  └─ migration.sql
│  │  ├─ 20250523181331_add_xp_to_user
│  │  │  └─ migration.sql
│  │  ├─ 20250523185914_add_social_login
│  │  │  └─ migration.sql
│  │  ├─ 20250524003134_add_content_block_types
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ project-structure-diagram.md
├─ qodana.yaml
├─ render.yaml
├─ scripts
│  ├─ ensure-db.sh
│  ├─ find-component-usage.js
│  └─ prisma-commands.sh
├─ stackinfo-mismatch-report.md
├─ stackinfo.txt
├─ stackudvkiling
├─ tsconfig.json
├─ turbo.json
├─ vision.txt
└─ yarn.lock

```
```
LearningLab

```