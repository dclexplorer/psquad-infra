import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const deployToLocalstack = config.getBoolean("deployToLocalstack") || false;

console.log("deployToLocalstack: ", deployToLocalstack)

// Set the AWS region
const awsRegion: aws.Region = (config.get("aws:region") as aws.Region) || "us-east-1";

// Configure the AWS provider
let provider: aws.Provider;

if (deployToLocalstack) {
    const localStackEndpoint = "http://localhost:4566"; // Adjust if using Docker

    provider = new aws.Provider("localstack", {
        skipCredentialsValidation: true,
        skipRequestingAccountId: true,
        skipMetadataApiCheck: true,
        s3ForcePathStyle: true,
        accessKey: "test",
        secretKey: "test",
        region: awsRegion,
        // Correctly format the endpoints as a map/object
        endpoints: [{
            s3: localStackEndpoint,
            sns: localStackEndpoint,
            sqs: localStackEndpoint,
            // Add other services as needed
        }],
    });
} else {
    provider = new aws.Provider("aws", {
        region: awsRegion,
        // Optionally specify credentials or rely on environment variables
    });
}

// only deploy s3 buckets on localstack for now...
if (deployToLocalstack) {
    // S3 Buckets
    const buckets = [
        "optimized-assets",
        "crdts",
        "glb",
        "minimap",
        "impostors",
    ];

    const bucketOutputs: { [key: string]: pulumi.Output<string> } = {};

    buckets.forEach(bucketName => {
        const bucket = new aws.s3.Bucket(bucketName, {
            bucket: bucketName,
            acl: "public-read",
        }, { provider });

        new aws.s3.BucketPublicAccessBlock(`${bucketName}-public-access-block`, {
            bucket: bucket.id,
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
        }, { provider });

        bucketOutputs[bucketName] = bucket.bucket;
    });
}

// SNS Topics
const sceneEntitiesSnsTopic = new aws.sns.Topic("SceneEntitiesSNS", {
    name: "SceneEntitiesSNS",
}, { provider });

const prioritySceneEntitiesSnsTopic = new aws.sns.Topic("PrioritySceneEntitiesSNS", {
    name: "PrioritySceneEntitiesSNS",
}, { provider });

const wearableEmoteEntitiesSnsTopic = new aws.sns.Topic("WearableEmoteEntitiesSNS", {
    name: "WearableEmoteEntitiesSNS",
}, { provider });

const crdtSnsTopic = new aws.sns.Topic("CRDTSNS", {
    name: "CRDTSNS",
}, { provider });

// SQS Queues
const sceneEntitiesSqsForCRDT = new aws.sqs.Queue("SceneEntitiesForCRDTSQS", {
    name: "SceneEntitiesForCRDTSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const sceneEntitiesSqsForMinimap = new aws.sqs.Queue("SceneEntitiesForMinimapSQS", {
    name: "SceneEntitiesForMinimapSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const sceneEntitiesSqsForAssetOptimization = new aws.sqs.Queue("SceneEntitiesForAssetOptimizationSQS", {
    name: "SceneEntitiesForAssetOptimizationSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const prioritySceneEntitiesSqsForAssetOptimization = new aws.sqs.Queue("PrioritySceneEntitiesForAssetOptimizationSQS", {
    name: "PrioritySceneEntitiesForAssetOptimizationSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const sceneEntitiesSqsForImposters = new aws.sqs.Queue("SceneEntitiesForImpostersSQS", {
    name: "SceneEntitiesForImpostersSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const prioritySceneEntitiesSqsForImposters = new aws.sqs.Queue("PrioritySceneEntitiesForImpostersSQS", {
    name: "PrioritySceneEntitiesForImpostersSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const wearableEmotesSqs = new aws.sqs.Queue("WearableEmotesSQS", {
    name: "WearableEmotesSQS",
    visibilityTimeoutSeconds: 30,
}, { provider });

const crdtSqsForExportScenes = new aws.sqs.Queue("CRDTSQSForExportScenes", {
    name: "CRDTSQSForExportScenes",
    visibilityTimeoutSeconds: 30,
}, { provider });

const crdtSqsForImpostors = new aws.sqs.Queue("CRDTSQSForImpostors", {
    name: "CRDTSQSForImpostors",
    visibilityTimeoutSeconds: 30,
}, { provider });

const crdtSqsForOptimizedAssets = new aws.sqs.Queue("CRDTSQSForOptimizedAssets", {
    name: "CRDTSQSForOptimizedAssets",
    visibilityTimeoutSeconds: 30,
}, { provider });

// Subscriptions
new aws.sns.TopicSubscription("SceneEntitiesSQSForCRDTSubscription", {
    topic: sceneEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: sceneEntitiesSqsForCRDT.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("SceneEntitiesSQSForMinimapSubscription", {
    topic: sceneEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: sceneEntitiesSqsForMinimap.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("SceneEntitiesSQSForAssetOptimizationSubscription", {
    topic: sceneEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: sceneEntitiesSqsForAssetOptimization.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("PrioritySceneEntitiesSQSForAssetOptimizationSubscription", {
    topic: prioritySceneEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: prioritySceneEntitiesSqsForAssetOptimization.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("SceneEntitiesSQSForImpostersSubscription", {
    topic: sceneEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: sceneEntitiesSqsForImposters.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("PrioritySceneEntitiesSQSForImpostersSubscription", {
    topic: prioritySceneEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: prioritySceneEntitiesSqsForImposters.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("WearableEmotesEntitiesSQSSubscription", {
    topic: wearableEmoteEntitiesSnsTopic.arn,
    protocol: "sqs",
    endpoint: wearableEmotesSqs.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("CRDTSQSForExportScenesSubscription", {
    topic: crdtSnsTopic.arn,
    protocol: "sqs",
    endpoint: crdtSqsForExportScenes.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("CRDTSQSForImpostorsSubscription", {
    topic: crdtSnsTopic.arn,
    protocol: "sqs",
    endpoint: crdtSqsForImpostors.arn,
    rawMessageDelivery: true,
}, { provider });

new aws.sns.TopicSubscription("CRDTSQSForOptimizedAssetsSubscription", {
    topic: crdtSnsTopic.arn,
    protocol: "sqs",
    endpoint: crdtSqsForOptimizedAssets.arn,
    rawMessageDelivery: true,
}, { provider });

// Grant SQS permissions to receive messages from SNS
function grantSqsPermission(queue: aws.sqs.Queue, topicArn: pulumi.Output<string>, resourceName: string) {
    const policy = pulumi.all([queue.arn, topicArn]).apply(([queueArn, topicArn]) => JSON.stringify({
        Version: "2012-10-17",
        Id: `${queueArn}/SQSDefaultPolicy`,
        Statement: [{
            Sid: "Allow-SNS-SendMessage",
            Effect: "Allow",
            Principal: "*",
            Action: "SQS:SendMessage",
            Resource: queueArn,
            Condition: {
                ArnEquals: {
                    "aws:SourceArn": topicArn,
                },
            },
        }],
    }));

    new aws.sqs.QueuePolicy(`${resourceName}-policy`, {
        queueUrl: queue.url,
        policy: policy,
    }, { provider });
}

grantSqsPermission(sceneEntitiesSqsForCRDT, sceneEntitiesSnsTopic.arn, "SceneEntitiesSQSForCRDT");
grantSqsPermission(sceneEntitiesSqsForMinimap, sceneEntitiesSnsTopic.arn, "SceneEntitiesSQSForMinimap");
grantSqsPermission(sceneEntitiesSqsForAssetOptimization, sceneEntitiesSnsTopic.arn, "SceneEntitiesSQSForAssetOptimization");
grantSqsPermission(prioritySceneEntitiesSqsForAssetOptimization, prioritySceneEntitiesSnsTopic.arn, "PrioritySceneEntitiesSQSForAssetOptimization");
grantSqsPermission(sceneEntitiesSqsForImposters, sceneEntitiesSnsTopic.arn, "SceneEntitiesSQSForImposters");
grantSqsPermission(prioritySceneEntitiesSqsForImposters, prioritySceneEntitiesSnsTopic.arn, "PrioritySceneEntitiesSQSForImposters");
grantSqsPermission(wearableEmotesSqs, wearableEmoteEntitiesSnsTopic.arn, "WearableEmotesEntitiesSQS");
grantSqsPermission(crdtSqsForExportScenes, crdtSnsTopic.arn, "CRDTSQSForExportScenes");
grantSqsPermission(crdtSqsForImpostors, crdtSnsTopic.arn, "CRDTSQSForImpostors");
grantSqsPermission(crdtSqsForOptimizedAssets, crdtSnsTopic.arn, "CRDTSQSForOptimizedAssets");
