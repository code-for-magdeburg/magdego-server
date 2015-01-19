var development = {
  port: 3000,

  env : global.process.env.NODE_ENV || 'development'
};

var production = {
  
  port: 62639,

  env : global.process.env.NODE_ENV || 'production'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;
