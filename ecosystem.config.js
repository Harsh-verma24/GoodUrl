module.exports = {
  apps: [
    {
      name: "vercel-upload-service",
      cwd: "./vercel-upload-service",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production"
      }
    },

    {
      name: "vercel-deploy-service",
      cwd: "./vercel-deploy-service",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production"
      }
    },

    {
      name: "vercel-request-service",
      cwd: "./vercel-request-service",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
