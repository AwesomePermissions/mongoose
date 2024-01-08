# Awesome Permissions SDK

[![NPM](https://img.shields.io/npm/l/@awesomepermissions/sdk)](https://github.com/awesomepermissions/sdk/blob/main/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/AwesomePermissions/sdk)](https://github.com/AwesomePermissions/sdk/graphs/contributors)
[![npm](https://img.shields.io/npm/v/@awesomepermissions/sdk)](https://www.npmjs.com/package/@awesomepermissions/sdk)
[![npm](https://img.shields.io/npm/dm/@awesomepermissions/sdk)](https://www.npmjs.com/package/@awesomepermissions/sdk)

Currently in progress.

Website: [`https://www.awesomepermissions.com`](https://www.awesomepermissions.com)

## Installation
```shell
npm install @awesomepermissions/sdk
```

## Usage
```javascript
const AwesomePermissions = require('@awesomepermissions/sdk');
const awp = new AwesomePermissions({ accessKey: 'your_access_key' });

const result = await awp.addPermissionsToItems({
    items: ['user-id'],
    itemTypes: ['user'],
    permissions: ['image-id'],
    actions: ['view'],
    ignoreDuplicateErrors: true,
});
```

For more information, please refer to the [`documentation`](https://www.awesomepermissions.com/docs)

## Contributors

<a href="https://github.com/AwesomePermissions/sdk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AwesomePermissions/sdk" />
</a>

## License

MIT