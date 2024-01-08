const AwesomePermissions = require("@awesomepermissions/sdk");


class MongooseAwesomePermissions {

    /**
     * Instance of @awesomepermissions/sdk
     * @private
     * */
    #awp = null;

    constructor(data) {
        this.#awp = new AwesomePermissions(data);
    }

    /** @private */
    async #postSave(ctx, doc) {
         await this.#awp.addPermissionsToItems({
             "items": [doc._id.toString()],
             "itemTypes": [this.#getCollectionName(doc)],
             "permissions": [this.#getPermissionName(doc)],
             "actions": this.#getAllDefaultActions(),
             "ignoreDuplicateErrors": true
         });
    }

    /** @private */
    async #preDeleteMany(ctx) {
        ctx.docsRemoved = await ctx.model.find(this._conditions).select(["_id"]);
    }

    /** @private */
    async #postDeleteMany(ctx) {
        if (ctx.docsRemoved?.length) {
            await this.#awp.removePermissionsToItems({
                "items": ctx.docsRemoved.map(doc => doc._id.toString()),
                "permissions": ctx.docsRemoved.map(doc => this.#getPermissionName(doc)),
                "itemTypes": [this.#getCollectionName(ctx.docsRemoved[0])],
                "actions": this.#getAllDefaultActions()
            });
        }
    }

    /** @private */
    async #preDeleteOne(ctx) {
        ctx.docsRemoved = await ctx.model.find(this._conditions).select(["_id"]);
    }

    /** @private */
    async #postDeleteOne(ctx) {
        if (ctx.docsRemoved?.length) {
            await this.#awp.removePermissionsToItems({
                "items": ctx.docsRemoved.map(doc => doc._id.toString()),
                "permissions": ctx.docsRemoved.map(doc => this.#getPermissionName(doc)),
                "itemTypes": [this.#getCollectionName(ctx.docsRemoved[0])],
                "actions": this.#getAllDefaultActions()
            });
        }
    }

    /** @private */
    async #postFindOneAndDelete(ctx, doc) {
        await this.#awp.removePermissionsToItems({
            "items": [doc._id.toString()],
            "permissions": [this.#getPermissionName(doc)],
            "itemTypes": [this.#getCollectionName(doc)],
            "actions": this.#getAllDefaultActions()
        });
    }

    /** @private */
    async #postInsertMany(ctx, docs) {
        await Promise.all(
            docs.map(doc => this.#awp.addPermissionsToItems({
                "items": [doc._id.toString()],
                "itemTypes": [this.#getCollectionName(doc)],
                "permissions": [this.#getPermissionName(doc)],
                "actions": this.#getAllDefaultActions(),
                "ignoreDuplicateErrors": true
            }))
        );
    }

    async #addPermissionsToItems(ctx, _docs, {actions, ignoreDuplicateErrors} = {}) {
        const docs = Array.isArray(_docs) ? _docs : [_docs];
        return this.#awp.addPermissionsToItems({
            "items": [ctx._id.toString()],
            "itemTypes": [this.#getCollectionName(ctx)],
            "permissions": docs.map(doc => this.#getPermissionName(doc)),
            "actions": actions || this.#getAllDefaultActions(),
            "ignoreDuplicateErrors": ignoreDuplicateErrors || true
        })
    }

    async #hasPermissionToItem(ctx, doc, {actions, returnPermissionsThatLinkThem = false} = {}) {
        return this.#awp.itemsHasAccessToItems({
            items: [ctx._id.toString()],
            itemsToAccess: [doc._id.toString()],
            returnPermissionsThatLinkThem
        })
    }

    #getDocsByType(_docs) {
        const docs = Array.isArray(_docs) ? _docs : [_docs];
        const result = {};
        for (const doc of docs) {
            const type = this.#getCollectionName(doc);
            if (!result[type]) {
                result[type] = [];
            }
            result[type].push(doc);
        }
        return result;
    }

    /**
     * Load mongoose schema
     * @function
     * @example
     * const mongooseAwp = new MongooseAwesomePermissions();
     * const gameSchema = new Schema({ title: String });
     * gameSchema.plugin(mongooseAwp.loadSchema);
     * */

    loadSchema() {
        return (schema, options) => {
            const _this = this;
            schema.post('save', function () {return  _this.#postSave.bind(_this)(this, ...arguments)});
            schema.pre('deleteMany', function () {return _this.#preDeleteMany.bind(_this)(this, ...arguments)});
            schema.post('deleteMany', function () {return _this.#postDeleteMany.bind(_this)(this, ...arguments)});
            schema.pre('deleteOne', function () {return _this.#preDeleteOne.bind(_this)(this, ...arguments)});
            schema.post('deleteOne', function () {return _this.#postDeleteOne.bind(_this)(this, ...arguments)});
            schema.post('findOneAndDelete', function () {return _this.#postFindOneAndDelete.bind(_this)(this, ...arguments)});
            schema.post('insertMany', function () {return _this.#postInsertMany.bind(_this)(this, ...arguments)});
            schema.methods.addPermissionsToItems = function () {return _this.#addPermissionsToItems.bind(_this)(this, ...arguments)}
            schema.methods.hasPermissionToItem = function () {return _this.#hasPermissionToItem.bind(_this)(this, ...arguments)}
        }

    }



    /** @private */
    #getCollectionName(doc) {
        // Check if doc is a valid document
        if (!doc || !doc.model) {
            throw new Error('Must be a valid mongoose document');
        }
        // We replace all the : for possible clash with our logic
        return doc.model().collection.name.replace(/:/g, '_');
    }

    /** @private */
    #getPermissionName(doc) {
        return this.#getCollectionName(doc) + ':' + doc._id.toString();
    }

    #getAllDefaultActions() {
        return ['view', 'create', 'update', 'delete', 'admin'];
    }

}

module.exports = MongooseAwesomePermissions;