const mongoose = require('mongoose');
const {EncryptionPlugin} = require('../lib');
const crypto = require('crypto');
const chai = require('chai');
const expect = chai.expect;

class Location {
  constructor(lat, loc) {
    this.lat = parseFloat(lat);
    this.loc = parseFloat(loc);
  }
  toString() {
    return JSON.stringify(this.toJSON());
  }
  toJSON() {
    const {lat, loc} = this;
    return {lat, loc};
  }
}
const TestSchema = new mongoose.Schema({
  name: {
    type: String,
    encrypted: true,
  },

  age: {
    type: Number,
  },
  tags: {
    type: [String],
    encrypted: true,
    required: false,
    default: null,
  },
  location: {
    type: Object,
    encrypted: true,
    required: false,
    default: null,
  },
});
const SECRET =
  '12343ae4b2d178b3f00441788bcabb7d268c1c87c0139d233cb6e8d3be12866177420f0ea6c071a302d05f0599991a4ae8312673c3b824edf8b53ad5cd4f25111b0f4e1ecef74aee491d245f3dbc671d7e0413b3b3e710dac7d7b3ee9f0ea0c0';
TestSchema.plugin(EncryptionPlugin, {
  secret: Buffer.from(SECRET, 'hex'),
});
const TestModel = mongoose.model('TestModel', TestSchema);

async function saveItem() {
  await TestModel.deleteMany({});
  const model = new TestModel({name: 'boi', age: 10});
  await model.save();
  await TestModel.insertMany([
    {
      name: 'utkarsh',
      age: 10,
      tags: ['cool', 'hardworking'],
      location: new Location(10.12312312, 12.11231231).toJSON(),
    },
    {name: 'check', age: 10},
  ]);
  expect(model.name).to.be.equal('boi');
  await TestModel.updateOne({id: model.id}, {name: 'renamed', age: 21});
  const name = (await TestModel.findOne({id: model.id})).name;
  expect(name).to.be.equal('renamed');
  expect((await TestModel.find({})).map((item) => item.name)).to.have.members([
    'utkarsh',
    'check',
    'renamed',
  ]);
}

async function test() {
  await mongoose.connect('mongodb://localhost:27017');
  await saveItem();
  await mongoose.connection.close();
}
test();
