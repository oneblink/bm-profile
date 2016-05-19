Get or Set the name of the credentials profile used for a Blink Project, and optionally configure the credentials.

The Credential file is automatically backed up to the same folder as the credentials file.

## Usage

- `bm profile`                    - Show the name of the current profile (defaults to 'default')
- `bm profile profileName`        - Sets the name of the profile to use to profileName
- `bm profile profileName --set`  - Same as above but also starts an interactive prompt and then sets the key and secret for the profile

