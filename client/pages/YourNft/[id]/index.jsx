import classes from "../../Discover/[gameName]/[id]/Traits.module.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { createStream, deleteStream } from "../../../superfluid/Superfluid";

const Details = () => {
  const [nftInformation, setNftInformation] = useState("");
  const [metaInfo, setMetaInfo] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeValue, setUpgradeValue] = useState(0);
  const { isConnected, address } = useAccount();
  const contract = useSelector((state) => state.auth.contract);
  const signer = useSelector((state) => state.auth.signer);
  const router = useRouter();

  const nftId = router.query.id;
  const tokenId = router.query.tokenId;

  useEffect(() => {
    if (isConnected) {
      (async function () {
        const data = await contract.currentNft(nftId);
        const cid = await contract.getCurrentMetadata(nftId);
        const cidData = await fetch(
          "https://metadata-server-j0am.onrender.com/pinataData",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cid: cid,
            }),
          }
        );

        const response = await cidData.json();

        setNftInformation(data);
        setMetaInfo(response.data);
      })();
    }
  }, [isConnected]);

  const upgradeHandler = async () => {
    /**Start the money stream for 'n' seconds acc to level number */
    //call createStream here

    if(nftInformation.currentLevel.toString() >= 3){
      return;
    }

    await createStream(signer, address);
    const tx = await contract.upgrade(tokenId);
    await tx.wait();
    setUpgrading(true);

    //let it run for n no of seconds
    var v = 0;
    let timeToRun;

    if (nftInformation.currentLevel.toString() == 1) {
      timeToRun = 440;
    } else if (nftInformation.currentLevel.toString() == 2) {
      timeToRun = 640;
    }

    const intervalId = setInterval(() => {
      v += 1;
      /**stop streaming after n no of seconds here */
      /**call stop function in smart contract to stop the upgradation */
      if (v >= 100) {
        (async function () {
          clearInterval(intervalId);
          await deleteStream(signer, address);
          await contract.stopFlow(tokenId);
          setUpgradeValue(0);
          setUpgrading(false);
          return;
        })();
      }
      setUpgradeValue((upgradeValue) => upgradeValue + 1);
    }, timeToRun);
  };

  return (
    <div>
      {nftInformation !== "" ? (
        <div className={classes.trait}>
          <div className={classes.image}>
            <img
              src={`https://gateway.pinata.cloud/ipfs/${metaInfo.image.substr(
                7,
                metaInfo.image.length
              )}`}
              width="450px"
              height="550px"
              alt="the image with description"
            />
          </div>
          <div className={classes.details}>
            <div className="alert alert-info shadow-lg">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current flex-shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  {3 - nftInformation.currentLevel.toString()} upgrades available
                </span>
              </div>
            </div>
            <div className={classes.description}>
              <h1
                className={classes.title}
              >{`${metaInfo.name} #${router.query.id}`}</h1>
              <div className={classes.align}>
              <div className={classes.price}>
                <h2>Initial Price</h2>
                <h3>
                  {ethers.utils.formatEther(nftInformation?.price.toString())}{" "}
                  ETH
                </h3>
                {upgrading && (
                  <div style={{marginTop:"15px"}}>
                    <span>Upgrading: &nbsp;</span>
                    <progress
                      style={{width:"80px"}}
                      className="progress progress-info w-56"
                      value={upgradeValue}
                      max="100"
                    ></progress>
                    &nbsp; {upgradeValue}
                  </div>
                )}
              </div>
              {metaInfo !== "" && (
                <div className={classes.qualities}>
                <h3 style={{fontSize:"1.4rem", fontWeight: "600"}}>Traits</h3>
                  <h4>
                    {metaInfo.attributes[0].trait_type}:{" "}
                    {metaInfo.attributes[0].value}
                  </h4>
                  <h4>
                    {metaInfo.attributes[1].trait_type}:{" "}
                    {metaInfo.attributes[1].value}
                  </h4>
                  <h4>Level: {nftInformation.currentLevel.toString()}</h4>
                  {nftInformation.currentLevel.toString() < 3 && (
                    <h4>
                      Upgradation Time:{" "}
                      {nftInformation.currentLevel.toString() == 1
                        ? "40 seconds"
                        : "60 seconds"}
                    </h4>
                  )}
                </div>
                )}
                </div>
                </div>
              <div>
              <button
                className={`btn btn-warning ${classes.button}`}
                onClick={upgradeHandler}
              >
                {upgrading ? "Upgrading..." : "Upgrade"}
              </button>
              </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", margin: "15% auto" }}>
          <progress className="progress w-56"></progress>
        </div>
      )}
    </div>
  );
};

export default Details;
