import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 1 });
    const sg = new ec2.SecurityGroup(this, 'securitygroup', { vpc, allowAllOutbound: true });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8443), 'allow bitcoin access from the world');
    const host = new ec2.BastionHostLinux(this, 'bitcoin', {
      vpc,
      blockDevices: [{
        deviceName: '/dev/xvdb',
        volume: ec2.BlockDeviceVolume.ebs(500, {
          encrypted: false,
          volumeType: ec2.EbsDeviceVolumeType.SC1
        }),
      }],
      securityGroup: sg,
      instanceName: "bitcoin-full-node",
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.SMALL)
    });
  }
}
