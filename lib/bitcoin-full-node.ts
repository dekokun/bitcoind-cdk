import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_route53 as r53 } from 'aws-cdk-lib';

export class BitcoinFullNodeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [{name: 'publicsubnet', subnetType: ec2.SubnetType.PUBLIC}]
    });
    const sg = new ec2.SecurityGroup(this, 'securitygroup', { vpc, allowAllOutbound: true });
    const bitcoinPort = 8333;
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(bitcoinPort), 'allow bitcoin access from the world');
    const host = new ec2.BastionHostLinux(this, 'bitcoin', {
      vpc,
      blockDevices: [{
        deviceName: '/dev/xvdb',
        // snapshot from instance that complete IBDs.
        volume: ec2.BlockDeviceVolume.ebsFromSnapshot('snap-048e503a8320e1756', {
          volumeType: ec2.EbsDeviceVolumeType.SC1,
          volumeSize: 500
        }),
      }],
      securityGroup: sg,
      instanceName: "bitcoin-full-node",
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO)
    });
    let eip = new ec2.CfnEIP(this, "Ip", {
      domain: 'vpc',
      instanceId: host.instanceId
    });
    let hostedZone = r53.HostedZone.fromHostedZoneAttributes(this, 'dekokun.info', { hostedZoneId: 'Z1SC2QTMQPRZLB', zoneName: 'dekokun.info'});
    new r53.ARecord(this, 'bitcoin.dekokun.info', {zone: hostedZone, recordName: 'bitcoin.dekokun.info', target: r53.RecordTarget.fromIpAddresses(eip.ref)})
  }
}
