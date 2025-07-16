module.exports = {
            google_callback: async ({
                req,
                res,
                project,
                parts,
                projectId,
                role,
                needRefreshToken,
                refreshToken,
                database,
                sdk,
                manaknightSDK,
                originalUrl,
                config,
                googleConfig
              }) => {
              console.log("Dummy google_callback function called");
              return;
            },
            apple_callback: async ({
                req,
                res,
                project,
                parts,
                projectId,
                role,
                needRefreshToken,
                refreshToken,
                database,
                sdk,
                manaknightSDK,
                originalUrl,
                config,
                googleConfig
              }) => {
              console.log("Dummy google_callback function called");
              return;
            },
          };