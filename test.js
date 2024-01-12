const MongooseAwesomePermissions = require('./lib');
const mongoose = require("mongoose");

(async () => {
    try {
        const awp = new MongooseAwesomePermissions({
            developMode: true,
            accessKey: 'rsCC6jwc74VxH6VScO2SwBDVvLFvS3JjljUZ6oGYzXU7V6Syh4_VSVi6qXQmYNks',// 'rss8mLLhnio3LlSwcgCjIuDsvfhiH435boT1USe0eo4Q7rcmwELOKPtSxTaPrNjl'
        });

        await mongoose.connect('mongodb://127.0.0.1:27017/mongoose-awp-test');

        const gameSchema = new mongoose.Schema({ title: String });
        const userSchema = new mongoose.Schema({ name: String });
        gameSchema.plugin(awp.loadSchema());
        userSchema.plugin(awp.loadSchema());

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


        process.exit();

    } catch (e) {
        console.error(e);
    }
})();