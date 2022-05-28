const mongoose = require('mongoose');
const {EncryptionPlugin} = require('../lib');
const crypto = require('crypto');
const chai = require("chai");
const expect = chai.expect;

const TestSchema = new mongoose.Schema({
  name: {
    type: String,
    encrypted: true,
  },

  age: {
    type: Number,
  },
});

TestSchema.plugin(EncryptionPlugin, {
  secret: Buffer.from(crypto.randomBytes(96)),
});
const TestModel = mongoose.model("TestModel", TestSchema);

async function saveItem() {
  await TestModel.remove({});
  const model = new TestModel({ name: "boi", age: 10 });

  await model.save();
  await TestModel.insertMany([
    {
      name: "utkarsh",
      age: 10,
    },
    { name: "check", age: 10 },
  ]);
  await TestModel.updateOne({ id: model.id }, { name: "renamed", age: 21 });
  expect(model.name).to.be.equal("boi");
  const name = (await TestModel.findOne({ id: model.id })).name;
  expect(name).to.be.equal("renamed");
  expect((await TestModel.find({})).map((item) => item.name)).to.have.members([
    "utkarsh",
    "check",
    "renamed",
  ]);
}

async function test() {
  await mongoose.connect("mongodb://localhost:27017");
  await saveItem();
  await mongoose.connection.close();
}
test();
