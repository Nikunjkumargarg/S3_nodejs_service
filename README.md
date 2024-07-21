
# S3 Bucket Clone NodeJs Service

This project is a Node.js application that emulates the core functionalities of AWS S3. It allows you to perform CRUD (Create, Read, Update, Delete) operations on buckets and files.




## Features

- Create Buckets: Allows users to create and manage storage buckets.
- Upload Files: Supports uploading files to specified buckets with support for any file format.
- Retrieve Files: Retrieves the files from bucket
- Delete Files: Enables deletion of files from buckets.
- List Buckets and Objects: Provides functionality to list all buckets and objects within a bucket.

The application uses local filesystem storage to manage files and integrates a simple API to handle file operations, providing a scalable solution for file management in a development or testing environment.


## API Reference

#### Sign Up

```http
  POST /api/register
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. |
| `password` | `string` | **Required**. |

#### Log In

```http
  POST /api/login
```

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username` | `string` | **Required**. |
| `password` | `string` | **Required**. |

#### Create Bucket

```http
  POST /api/buckets
```

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `bucketName` | `string` | **Required**. |
| `isPrivate` | `boolean` |  |

#### Upload Image

```http
  POST /api/buckets/<bucketName>/objects
  POST /api/buckets/<bucketName>/objects/<filename>
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `filename` | `string` | for having custom file name. |
| `bucketName` | `string` | **Required** |

| Body | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `file` | `file` | **Required** |

#### List images of Bucket

```http
  GET /api/buckets/pludous/objects
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `bucketName` | `string` | **Required**.|
