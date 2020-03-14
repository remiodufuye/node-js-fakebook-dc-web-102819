"use strict";

const bookshelf = require('../db/bookshelf');

const Comment = require('./comment');
const Post = require('./post');
const bcrypt = require('bcrypt');

const User = bookshelf.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', this.encryptPassword);
    this.on('destroying', this.destroyAllAttached);
  },
  hasTimestamps: true,
  posts: function() {
    return this.hasMany(Posts, 'author');
  },
  comments: function() {
    return this.hasMany(Comments);
  },
  followers: function() {
    return this.belongsToMany(User, 'users_users', 'user_id', 'follower_id');
  },
  following: function() {
    return this.belongsToMany(User, 'users_users', 'follower_id', 'user_id');
  },
  encryptPassword:(model, attrs, options) => {
    return new Promise((resolve, reject) => {
      bcrypt.hash(model.attributes.password, 10, (err, hash) => {
        if (err) return reject(err);
        model.set('password', hash);
        resolve(hash);
      });
    });
  },
  destroyAllAttached: function(model, options) {
    return Promise.all([
      bookshelf
        .knex('users_users')
        .where('user_id', model.get('id'))
        .delete(),
      bookshelf
        .knex('users_users')
        .where('follower_id', model.get('id'))
        .delete()
    ]);
  },
  validatePassword: function(suppliedPassword) {
    let self = this;
    return new Promise(function(resolve, reject) {
      const hash = self.attributes.password;
      bcrypt.compare(suppliedPassword, hash, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  },
});

module.exports = bookshelf.model('User', User);