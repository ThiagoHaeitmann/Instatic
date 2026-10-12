import { accountUsersEnglishMessages, accountUsersPortugueseMessages } from './accountUsersMessages'
import { metadataEnglishMessages, metadataPortugueseMessages } from './metadataMessages'
import { dashboardEnglishMessages, dashboardPortugueseMessages } from './dashboardMessages'
import { shellEnglishMessages, shellPortugueseMessages } from './shellMessages'
import { uiEnglishMessages, uiPortugueseMessages } from './uiMessages'

export type MessageCatalog = Readonly<Record<string, string>>

export const englishMessages = {
  ...accountUsersEnglishMessages,
  ...metadataEnglishMessages,
  ...dashboardEnglishMessages,
  ...shellEnglishMessages,
  ...uiEnglishMessages,
  'common.language.label': 'Language',
  'common.language.description': 'Choose the language used by the admin interface on this device.',
  'common.language.english': 'English',
  'common.language.portugueseBrazil': 'Português (Brasil)',
  'common.errors.unhandledRender': 'Unhandled render error',
  'auth.boot.unavailable': 'CMS is unavailable',
  'auth.setup.title': 'Set Up CMS',
  'auth.setup.submit': 'Create Admin',
  'auth.setup.pending': 'Setting up',
  'auth.setup.failed': 'Setup failed',
  'auth.login.title': 'Admin Login',
  'auth.login.submit': 'Sign In',
  'auth.login.pending': 'Signing in',
  'auth.login.failed': 'Login failed',
  'auth.mfa.title': 'Two-Factor Authentication',
  'auth.mfa.submit': 'Verify',
  'auth.mfa.pending': 'Verifying',
  'auth.mfa.failed': 'MFA verification failed',
  'auth.fields.authenticationCode': 'Authentication code',
  'auth.fields.siteName': 'Site name',
  'auth.fields.yourName': 'Your name',
  'auth.fields.yourNameHint': 'optional, shown on published pages',
  'auth.fields.email': 'Email',
  'auth.fields.password': 'Password',
  'auth.validation.email': 'Enter a valid email address',
  'auth.validation.passwordMinimum.one': 'Password must be at least {{count}} character',
  'auth.validation.passwordMinimum.other': 'Password must be at least {{count}} characters',

} as const satisfies MessageCatalog

export const portugueseBrazilMessages = {
  ...accountUsersPortugueseMessages,
  ...metadataPortugueseMessages,
  ...dashboardPortugueseMessages,
  ...shellPortugueseMessages,
  ...uiPortugueseMessages,
  'common.language.label': 'Idioma',
  'common.language.description': 'Escolha o idioma usado pela interface administrativa neste dispositivo.',
  'common.language.english': 'English',
  'common.language.portugueseBrazil': 'Português (Brasil)',
  'common.errors.unhandledRender': 'Erro de renderização não tratado',
  'auth.boot.unavailable': 'O CMS está indisponível',
  'auth.setup.title': 'Configurar o CMS',
  'auth.setup.submit': 'Criar administrador',
  'auth.setup.pending': 'Configurando',
  'auth.setup.failed': 'Falha na configuração',
  'auth.login.title': 'Login administrativo',
  'auth.login.submit': 'Entrar',
  'auth.login.pending': 'Entrando',
  'auth.login.failed': 'Falha no login',
  'auth.mfa.title': 'Autenticação de dois fatores',
  'auth.mfa.submit': 'Verificar',
  'auth.mfa.pending': 'Verificando',
  'auth.mfa.failed': 'Falha na verificação de dois fatores',
  'auth.fields.authenticationCode': 'Código de autenticação',
  'auth.fields.siteName': 'Nome do site',
  'auth.fields.yourName': 'Seu nome',
  'auth.fields.yourNameHint': 'opcional, exibido nas páginas publicadas',
  'auth.fields.email': 'E-mail',
  'auth.fields.password': 'Senha',
  'auth.validation.email': 'Digite um endereço de e-mail válido',
  'auth.validation.passwordMinimum.one': 'A senha deve ter pelo menos {{count}} caractere',
  'auth.validation.passwordMinimum.other': 'A senha deve ter pelo menos {{count}} caracteres',

} as const satisfies Record<keyof typeof englishMessages, string>

type BaseMessageKey<TKey extends string> = TKey extends `${infer Base}.${Intl.LDMLPluralRule}` ? Base : TKey
export type MessageKey = BaseMessageKey<keyof typeof englishMessages>
