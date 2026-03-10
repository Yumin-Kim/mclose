import { Profile } from 'passport';

export interface IGoogleProfile extends Profile {
  accessToken: string;
}

// export interface I{
//     "id": "103378418292397157536",
//     "displayName": "김유민",
//     "name": {
//       "familyName": "김",
//       "givenName": "유민"
//     },
//     "emails": [
//       {
//         "value": "dbals0@naver.com",
//         "verified": true
//       }
//     ],
//     "photos": [
//       {
//         "value": "https://lh3.googleusercontent.com/a/ACg8ocLtfT9X5x74YHGkZjBfz-PHjC0__9XfHdLJjMxtzYW-4A=s96-c"
//       }
//     ],
//     "provider": "google",
//     "_raw": "{\n  \"sub\": \"103378418292397157536\",\n  \"name\": \"김유민\",\n  \"given_name\": \"유민\",\n  \"family_name\": \"김\",\n  \"picture\": \"https://lh3.googleusercontent.com/a/ACg8ocLtfT9X5x74YHGkZjBfz-PHjC0__9XfHdLJjMxtzYW-4A\\u003ds96-c\",\n  \"email\": \"dbals0@naver.com\",\n  \"email_verified\": true,\n  \"locale\": \"ko\"\n}",
//     "_json": {
//       "sub": "103378418292397157536",
//       "name": "김유민",
//       "given_name": "유민",
//       "family_name": "김",
//       "picture": "https://lh3.googleusercontent.com/a/ACg8ocLtfT9X5x74YHGkZjBfz-PHjC0__9XfHdLJjMxtzYW-4A=s96-c",
//       "email": "dbals0@naver.com",
//       "email_verified": true,
//       "locale": "ko"
//     }
//   }
