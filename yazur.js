const Yazur_path = "./modules/interface";
const Yazur = {
    netmgr:   require(`${Yazur_path}/YololNetworkManager`),
    yChip: require(`${Yazur_path}/YololChip`),
    mChip: require(`${Yazur_path}/MemoryChip`),
    recvr: require(`${Yazur_path}/Reciever`)
}

module.exports=Yazur;