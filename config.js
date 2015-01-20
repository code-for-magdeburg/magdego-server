var development = {
  port: 3000,

  env : global.process.env.NODE_ENV || 'development'
};

var production = {
  
  port: 62640,

  env : global.process.env.NODE_ENV || 'production'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;
