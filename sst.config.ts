import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "express-react-nextjs-ssr",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      // Deploy Next.js site to AWS Lambda
      const site = new NextjsSite(stack, "site", {
        // Environment variables for the application
        environment: {
          MONGODB_URI: process.env.MONGODB_URI || "",
          PORT: process.env.PORT || "3000",
        },
        // Custom domain configuration (optional)
        // customDomain: {
        //   domainName: "example.com",
        //   hostedZone: "example.com",
        // },
      });

      // Output the site URL
      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
