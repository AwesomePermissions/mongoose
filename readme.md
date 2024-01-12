# Awesome Permissions Mongoose

[![NPM](https://img.shields.io/npm/l/@awesomepermissions/mongoose)](https://github.com/awesomepermissions/mongoose/blob/main/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/AwesomePermissions/mongoose)](https://github.com/AwesomePermissions/mongoose/graphs/contributors)
[![npm](https://img.shields.io/npm/v/@awesomepermissions/mongoose)](https://www.npmjs.com/package/@awesomepermissions/mongoose)
[![npm](https://img.shields.io/npm/dm/@awesomepermissions/mongoose)](https://www.npmjs.com/package/@awesomepermissions/mongoose)

Currently in progress.

Website: [`https://www.awesomepermissions.com`](https://www.awesomepermissions.com)

## Installation
```shell
npm install @awesomepermissions/mongoose
```

## Usage
```javascript
const MongooseAwesomePermissions = require("@awesomepermissions/mongoose");
const mongoose = require("mongoose");

const mawp = new MongooseAwesomePermissions('rsCC6jwc74VxH6VScO2SwBDVvLFvS3JjljUZ6oGYzXU7V6Syh4_VSVi6qXQmYNks');

await mongoose.connect('mongodb://127.0.0.1:27017/mongoose-awp-test');

const gameSchema = new mongoose.Schema({ title: String });
const userSchema = new mongoose.Schema({ name: String });
gameSchema.plugin(mawp.loadSchema());
userSchema.plugin(mawp.loadSchema());

const Game = mongoose.model('Game', gameSchema);
const User = mongoose.model('User', userSchema);

const game = new Game({ title: 'Game 1' });
const user = new User({ name: 'User 1' });

await game.save();
await user.save();

await user.addViewPermissionsToItems(game);
const hasPermission = await user.hasViewPermissionToItem(game);
console.log('hasPermission', hasPermission);
const itemsWithPermissions = await user.getItemsWithViewPermission();
console.log('itemsWithPermissions', itemsWithPermissions);

await Game.deleteOne({_id: game._id});
await User.findByIdAndDelete(user._id);
```

## New mongoose model functions

- addPermissionsToItems(mongoDocument/s, {actions, ignoreDuplicateErrors});
- addViewPermissionsToItems(mongoDocument/s, {ignoreDuplicateErrors});
- addCreatePermissionsToItems(mongoDocument/s, {ignoreDuplicateErrors});
- addUpdatePermissionsToItems(mongoDocument/s, {ignoreDuplicateErrors});
- addDeletePermissionsToItems(mongoDocument/s, {ignoreDuplicateErrors});
- addAdminPermissionsToItems(mongoDocument/s, {ignoreDuplicateErrors});
- hasPermissionToItem(mongoDocument, {actions, actionsType = "or" || "and"});
- hasViewPermissionToItem(mongoDocument, {actions, actionsType = "or" || "and"});
- hasCreatePermissionToItem(mongoDocument);
- hasUpdatePermissionToItem(mongoDocument);
- hasDeletePermissionToItem(mongoDocument);
- hasAdminPermissionToItem(mongoDocument);
- getItemsWithPermission({itemTypes, actions, actionsType = "or" || "and"});
- getItemsWithViewPermission({itemTypes});
- getItemsWithCreatePermission({itemTypes});
- getItemsWithUpdatePermission({itemTypes});
- getItemsWithDeletePermission({itemTypes});
- getItemsWithAdminPermission({itemTypes});
- getItemPermissions({raw})

## Contributors

<a href="https://github.com/AwesomePermissions/mongoose/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AwesomePermissions/mongoose" />
</a>

## License

MIT