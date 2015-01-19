var development = {
  num_nearest_stations: 10,

  port: 3000,

  env : global.process.env.NODE_ENV || 'development'
};

var production = {
  num_nearest_stations: 10,
  
  port: 80,

  env : global.process.env.NODE_ENV || 'production'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;
