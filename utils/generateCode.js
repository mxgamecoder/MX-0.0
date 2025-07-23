function generateCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10); // digits only (0-9)
  }
  return code;
}

module.exports = generateCode;