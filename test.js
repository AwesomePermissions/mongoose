const MongooseAwesomePermissions = require('./lib');
const {Schema, model} = require("mongoose");
const mongoose = require("mongoose");

(async () => {
    try {
        const awp = new MongooseAwesomePermissions({
            developMode: true,
            accessKey: 'rsCC6jwc74VxH6VScO2SwBDVvLFvS3JjljUZ6oGYzXU7V6Syh4_VSVi6qXQmYNks',// 'rss8mLLhnio3LlSwcgCjIuDsvfhiH435boT1USe0eo4Q7rcmwELOKPtSxTaPrNjl'
        });

        await mongoose.connect('mongodb://127.0.0.1:27017/mongoose-awp-test');

        const gameSchema = new Schema({ title: String });
        const userSchema = new Schema({ name: String });
        gameSchema.plugin(awp.loadSchema());
        userSchema.plugin(awp.loadSchema());

        const Game = model('Game', gameSchema);
        const User = model('User', userSchema);

        const game = new Game({ title: 'Game 1' });
        const user = new User({ name: 'User 1' });
        const user2 = new User({ name: 'User 3' });

        await Game.insertMany([{ title: 'Game 2' }, { title: 'Game 3' }]);

        await game.save();
        await user.save();
        await user2.save();

        await user.addPermissionsToItems(game);
        const hasPermission = await user.hasPermissionToItem(game);
        console.log('hasPermission', hasPermission);

        await Game.deleteOne({_id: game._id});
        await User.findByIdAndDelete(user._id);
        await User.findOneAndDelete({_id: user2._id});

        process.exit();

    } catch (e) {
        console.error(e);
    }
})();