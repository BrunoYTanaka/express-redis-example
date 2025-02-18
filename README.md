# Redis Express TypeScript Example

## Description
This project is written in TypeScript using Express and connects to Redis. It provides a simple CRUD interface with support for both regular Redis and Redis Cluster.

## Features
- Express
- Ioredis
- Typescript
- Jest

## Installation
To install the project dependencies, run:
```bash
npm install
```

## Usage
To start the project, use the following command:
```bash
npm run dev
```

## Configuration
Configure your Redis connection in the `.env.dev` file:
```
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_CLUSTER=
PORT=3000
```

Configure your Cluster connection in `.env.dev` file:
```
REDIS_HOST=127.0.0.1
REDIS_PORT=700
REDIS_CLUSTER=true
PORT=3000
```
## Notes

To use Redis Cluster, you need to configure the node cluster. There is a repository that contains code to create all the necessary nodes. You can find it [here](https://github.com/redis/redis/blob/unstable/utils/create-cluster/README). Follow the README and remember to update the `.env.dev` file to use the cluster and start the cluster nodes.

You don't need to configure all nodes in the Redis configuration. According to the ioredis documentation, the list does not need to enumerate all your cluster nodes. Instead, include a few nodes so that if one is unreachable, the client will try the next one. The client will automatically discover other nodes once at least one node is connected.

If you use [hashtags](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/#hash-tags) for Cluster, starting from version 7.4, Redis supports key expiration in sets with hashtags. However, ioredis does not yet have a native method to leverage this feature. A possible workaround for this limitation was discussed in this [comment](https://github.com/redis/ioredis/issues/1898#issuecomment-2364674141) on the ioredis repository.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for more information.