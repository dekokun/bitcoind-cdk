import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2_targets as elbv2_t } from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 1 });
    const sg = new ec2.SecurityGroup(this, 'securitygroup', { vpc, allowAllOutbound: true });
    const bitcoinPort = 8333;
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(bitcoinPort), 'allow bitcoin access from the world');
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
    const host2 = new ec2.BastionHostLinux(this, 'bitcoin-ssd', {
      vpc,
      blockDevices: [{
        deviceName: '/dev/xvdb',
        volume: ec2.BlockDeviceVolume.ebs(500, {
          encrypted: false,
          volumeType: ec2.EbsDeviceVolumeType.GP3
        }),
      }],
      instanceName: "bitcoin-full-node-ssd",
      securityGroup: sg,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.SMALL)
    });

    const lb = new elbv2.NetworkLoadBalancer(this, 'lb', { vpc, internetFacing: true });
    const listener = lb.addListener('listener', { port: bitcoinPort });;
    listener.addTargets('target', { port: bitcoinPort, targets: [new elbv2_t.InstanceTarget(host2.instance)]});
  }
}
