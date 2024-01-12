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

    #isObject(doc) {
        return typeof doc === 'object' && !Array.isArray(doc);
    }

    #isString(doc) {
        return typeof doc === 'string';
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
        ctx.docsRemoved = await ctx.model.find(ctx._conditions).select(["_id"]);
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
        ctx.docsRemoved = await ctx.model.find(ctx._conditions).select(["_id"]);
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

    /** @private */
    async #addPermissionsToItems(ctx, _docs, {actions, ignoreDuplicateErrors} = {}) {
        const docs = Array.isArray(_docs) ? _docs : [_docs];
        return this.#awp.addPermissionsToItems({
            "items": [ctx._id.toString()],
            "itemTypes": [this.#getCollectionName(ctx)],
            "permissions": docs.map(doc => this.#getPermissionName(doc)),
            "actions": actions || this.#getAllDefaultActions(),
            "ignoreDuplicateErrors": ignoreDuplicateErrors || true
        });
    }

    /** @private */
    async #addViewPermissionsToItems(ctx, _docs, {ignoreDuplicateErrors} = {}) {
        return this.#addPermissionsToItems(ctx, _docs, {actions: ["view"], ignoreDuplicateErrors});
    }

    /** @private */
    async #addCreatePermissionsToItems(ctx, _docs, {ignoreDuplicateErrors} = {}) {
        return this.#addPermissionsToItems(ctx, _docs, {actions: ["create"], ignoreDuplicateErrors});
    }

    /** @private */
    async #addUpdatePermissionsToItems(ctx, _docs, {ignoreDuplicateErrors} = {}) {
        return this.#addPermissionsToItems(ctx, _docs, {actions: ["update"], ignoreDuplicateErrors});
    }

    /** @private */
    async #addDeletePermissionsToItems(ctx, _docs, {ignoreDuplicateErrors} = {}) {
        return this.#addPermissionsToItems(ctx, _docs, {actions: ["delete"], ignoreDuplicateErrors});
    }

    /** @private */
    async #addAdminPermissionsToItems(ctx, _docs, {ignoreDuplicateErrors} = {}) {
        return this.#addPermissionsToItems(ctx, _docs, {actions: ["admin"], ignoreDuplicateErrors});
    }

    /** @private */
    async #hasPermissionToItem(ctx, doc, {actions, actionsType = "or"} = {}) {
        if (!this.#isString(doc) && !this.#isObject(doc)) throw new Error("doc must be an object or string");
        const [response] = await this.#awp.itemsHasAccessToItems({
            items: [ctx._id.toString()],
            itemsToAccess: [this.#isString(doc) ? doc : doc._id.toString()],
            returnPermissionsThatLinkThem: true
        });
        if (actions && response) {
            const _actions = Array.isArray(actions) ? actions : [actions];
            const linkedActions = [];
            for (const permAction of response.permissionsThatLinkThem) {
                for (const act of permAction.actions) {
                    if (linkedActions.indexOf(act) === -1 && _actions.indexOf(act) !== -1) {
                        linkedActions.push(act);
                    }
                }
            }
            response.hasAccess = false;
            if (actionsType === "or") {
                if (linkedActions.length) {
                    response.hasAccess = true;
                }
            } else if (actionsType === "and") {
                if (linkedActions.length === _actions.length) {
                    response.hasAccess = true;
                }
            }
        }
        return response;
    }

    /** @private */
    async #hasViewPermissionToItem(ctx, doc) {
        return this.#hasPermissionToItem(ctx, doc, {actions: ["view"]});
    }

    /** @private */
    async #hasCreatePermissionToItem(ctx, doc) {
        return this.#hasPermissionToItem(ctx, doc, {actions: ["create"]});
    }

    /** @private */
    async #hasUpdatePermissionToItem(ctx, doc) {
        return this.#hasPermissionToItem(ctx, doc, {actions: ["update"]});
    }

    /** @private */
    async #hasDeletePermissionToItem(ctx, doc) {
        return this.#hasPermissionToItem(ctx, doc, {actions: ["delete"]});
    }

    /** @private */
    async #hasAdminPermissionToItem(ctx, doc) {
        return this.#hasPermissionToItem(ctx, doc, {actions: ["admin"]});
    }

    /** @private */
    async #getItemsWithPermission(ctx, {itemTypes, actions, actionsType = "or"} = {}) {
        const [response] = await this.#awp.getItemsWithPermissionsForItems({
            items: [ctx._id.toString()],
            itemTypes: itemTypes,
            returnPermissionsThatLinkThem: true
        });


        if (actions && response) {
            const _actions = Array.isArray(actions) ? actions : [actions];
            const linkedActions = [];
            for (let i = response.itemsWithThePermissionsThatLinkThem.length - 1; i >= 0; i--) {
                const permAction = response.itemsWithThePermissionsThatLinkThem[i];
                for (const act of permAction.actions) {
                    if (linkedActions.indexOf(act) === -1 && _actions.indexOf(act) !== -1) {
                        linkedActions.push(act);
                    }
                }
                let remove = false;
                if (actionsType === "or") {
                    if (!linkedActions.length) {
                        remove = true;
                    }
                } else if (actionsType === "and") {
                    if (linkedActions.length !== _actions.length) {
                        remove = true;
                    }
                }
                if (remove) {
                    const index = response.itemsWithPermission.indexOf(permAction.item);
                    response.itemsWithPermission.splice(index, 1);
                    response.itemsWithThePermissionsThatLinkThem.splice(i, 1);
                }
            }

        }


        let idsByType = {};
        for (const perm of response.itemsWithThePermissionsThatLinkThem) {
            if (!idsByType[perm.itemTypes[0]]) idsByType[perm.itemTypes[0]] = [];
            idsByType[perm.itemTypes[0]].push(perm.item);
        }

        const promises = [];
        for (const type in idsByType) {
            try {
                const model = ctx.model(type);
                promises.push(model.find({_id: {$in: idsByType[type]}}));
            } catch (e) {}
        }
        const docs = await Promise.all(promises);
        response.mongooseItems = [];
        response.mongooseItemsByType = {};
        for (const doc of docs) {
            for (const d of doc) {
                response.mongooseItems.push(d);
                if (!response.mongooseItemsByType[this.#getCollectionName(d)]) response.mongooseItemsByType[this.#getCollectionName(d)] = [];
                response.mongooseItemsByType[this.#getCollectionName(d)].push(d);
            }
        }
        return response;
    }

    /** @private */
    async #getItemsWithViewPermission(ctx, {itemTypes} = {}) {
        return this.#getItemsWithPermission(ctx, {itemTypes, actions: ["view"]});
    }

    /** @private */
    async #getItemsWithCreatePermission(ctx, {itemTypes} = {}) {
        return this.#getItemsWithPermission(ctx, {itemTypes, actions: ["create"]});
    }

    /** @private */
    async #getItemsWithUpdatePermission(ctx, {itemTypes} = {}) {
        return this.#getItemsWithPermission(ctx, {itemTypes, actions: ["update"]});
    }

    /** @private */
    async #getItemsWithDeletePermission(ctx, {itemTypes} = {}) {
        return this.#getItemsWithPermission(ctx, {itemTypes, actions: ["delete"]});
    }

    /** @private */
    async #getItemsWithAdminPermission(ctx, {itemTypes} = {}) {
        return this.#getItemsWithPermission(ctx, {itemTypes, actions: ["admin"]});
    }

    async #getItemPermissions(ctx, {raw = false} = {}) {
        const [response] = await this.#awp.getItemsPermissions({items: [ctx._id.toString()], raw});
        return response?.permissions || [];
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
            schema.methods.addViewPermissionsToItems = function () {return _this.#addViewPermissionsToItems.bind(_this)(this, ...arguments)}
            schema.methods.addCreatePermissionsToItems = function () {return _this.#addCreatePermissionsToItems.bind(_this)(this, ...arguments)}
            schema.methods.addUpdatePermissionsToItems = function () {return _this.#addUpdatePermissionsToItems.bind(_this)(this, ...arguments)}
            schema.methods.addDeletePermissionsToItems = function () {return _this.#addDeletePermissionsToItems.bind(_this)(this, ...arguments)}
            schema.methods.addDeletePermissionsToItems = function () {return _this.#addAdminPermissionsToItems.bind(_this)(this, ...arguments)}
            schema.methods.hasPermissionToItem = function () {return _this.#hasPermissionToItem.bind(_this)(this, ...arguments)}
            schema.methods.hasViewPermissionToItem = function () {return _this.#hasViewPermissionToItem.bind(_this)(this, ...arguments)}
            schema.methods.hasCreatePermissionToItem = function () {return _this.#hasCreatePermissionToItem.bind(_this)(this, ...arguments)}
            schema.methods.hasUpdatePermissionToItem = function () {return _this.#hasUpdatePermissionToItem.bind(_this)(this, ...arguments)}
            schema.methods.hasDeletePermissionToItem = function () {return _this.#hasDeletePermissionToItem.bind(_this)(this, ...arguments)}
            schema.methods.hasAdminPermissionToItem = function () {return _this.#hasAdminPermissionToItem.bind(_this)(this, ...arguments)}
            schema.methods.getItemsWithPermission = function () {return _this.#getItemsWithPermission.bind(_this)(this, ...arguments)}
            schema.methods.getItemsWithViewPermission = function () {return _this.#getItemsWithViewPermission.bind(_this)(this, ...arguments)}
            schema.methods.getItemsWithCreatePermission = function () {return _this.#getItemsWithCreatePermission.bind(_this)(this, ...arguments)}
            schema.methods.getItemsWithUpdatePermission = function () {return _this.#getItemsWithUpdatePermission.bind(_this)(this, ...arguments)}
            schema.methods.getItemsWithDeletePermission = function () {return _this.#getItemsWithDeletePermission.bind(_this)(this, ...arguments)}
            schema.methods.getItemsWithAdminPermission = function () {return _this.#getItemsWithAdminPermission.bind(_this)(this, ...arguments)}
            schema.methods.getItemPermissions = function () {return _this.#getItemPermissions.bind(_this)(this, ...arguments)}
        };

    }



    /** @private */
    #getCollectionName(doc) {
        // Check if doc is a valid document
        if (!doc || !doc.model) {
            throw new Error('Must be a valid mongoose document');
        }
        // We replace all the : for possible clash with our logic
        return doc.model().collection.modelName.replace(/:/g, '_');
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