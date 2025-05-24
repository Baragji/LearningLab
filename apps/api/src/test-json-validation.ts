import { socialLinksSchema } from './users/schemas/social-links.schema';
import { userSettingsSchema } from './users/schemas/user-settings.schema';
import { ZodError } from 'zod';

function testJsonValidation() {
  console.log('Testing JSON validation with Zod schemas...');
  
  // Test valid social links
  const validSocialLinks = {
    twitter: 'https://twitter.com/username',
    linkedin: 'https://linkedin.com/in/username',
    github: 'https://github.com/username',
    website: 'https://example.com'
  };
  
  // Test invalid social links
  const invalidSocialLinks = {
    twitter: 'not-a-url',
    linkedin: 'https://linkedin.com/in/username',
    github: 'https://github.com/username',
    website: 'example.com' // Missing https://
  };
  
  // Test valid user settings
  const validUserSettings = {
    notifications: {
      email: true,
      browser: false
    },
    privacy: {
      showProfile: true,
      showProgress: false
    },
    theme: 'dark'
  };
  
  // Test invalid user settings
  const invalidUserSettings = {
    notifications: {
      email: 'yes', // Should be boolean
      browser: false
    },
    privacy: {
      showProfile: true,
      showProgress: false
    },
    theme: 'custom' // Not in enum
  };
  
  // Test social links validation
  console.log('\nTesting social links validation:');
  try {
    const result = socialLinksSchema.parse(validSocialLinks);
    console.log('Valid social links passed validation:', result);
  } catch (error) {
    console.error('Valid social links failed validation:', error);
  }
  
  try {
    const result = socialLinksSchema.parse(invalidSocialLinks);
    console.log('Invalid social links passed validation (should fail):', result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log('Invalid social links correctly failed validation:', error.errors.map(e => e.message).join(', '));
    } else {
      console.error('Unknown error:', error);
    }
  }
  
  // Test user settings validation
  console.log('\nTesting user settings validation:');
  try {
    const result = userSettingsSchema.parse(validUserSettings);
    console.log('Valid user settings passed validation:', result);
  } catch (error) {
    console.error('Valid user settings failed validation:', error);
  }
  
  try {
    const result = userSettingsSchema.parse(invalidUserSettings);
    console.log('Invalid user settings passed validation (should fail):', result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log('Invalid user settings correctly failed validation:', error.errors.map(e => e.message).join(', '));
    } else {
      console.error('Unknown error:', error);
    }
  }
  
  console.log('\nJSON validation testing completed!');
}

testJsonValidation();