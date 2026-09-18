/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config, { isServer }) => {
		config.resolve.fallback = {
			...config.resolve.fallback,
			canvas: false,
		};
		if (isServer) {
			config.externals = [...(config.externals || []), 'canvas'];
		}
		return config;
	},
};

module.exports = nextConfig;
