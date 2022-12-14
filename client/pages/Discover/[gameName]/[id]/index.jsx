import classes from "./Traits.module.css";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const Traits = () => {
  const [information, setInformation] = useState(null);
  const [metaInfo, setMetaInfo] = useState("");
  const [isOwned, setIsOwned] = useState(false);
  const router = useRouter();
  const contract = useSelector((state) => state.auth.contract);
  const { isConnected } = useAccount();

  const id = router.query.id;

  useEffect(() => {
    if (isConnected) {
      (async function () {
        const data = await contract.currentNft(id);
        const metadata = await contract.getCurrentMetadata(id);

        const info = await fetch("https://metadata-server-j0am.onrender.com/pinataData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cid: metadata,
          }),
        });
        const res = await info.json();
        setIsOwned(data.isSold);
        setMetaInfo(res.data);
        setInformation(data);
      })();
    }
  }, [isConnected]);

  const mintHandler = async () => {
    const tx = await contract.mint(router.query.id, {
      value: information.price,
    });
    await tx.wait();
    setIsOwned(true);
  };
  const passHandler = async () => {
    console.log("The nft is already sold");
  };

  return (
    <div>
      {information ? (
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{3 - information.currentLevel.toString()} upgrades available</span>
            </div>
          </div>
            <div className={classes.description}>
              <h1
                className={classes.title}
              >{`${information.name} #${router.query.id}`}</h1>
              <div className={classes.align}>
              <div className={classes.price}>
                <h2>Price</h2>
                <h3>
                  {ethers.utils.formatEther(information.price.toString())} ETH
                </h3>
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
                  <h4>Level: {information.currentLevel.toString()}</h4>
                </div>
                )}
                </div>
            </div>
            <div>
              <button
                className={`btn btn-warning ${classes.button}`}
                onClick={!isOwned ? mintHandler : passHandler}
              >
                {!isOwned ? "Buy Now" : "Already sold"}
              </button>
            </div>
          </div>
        </div>
        )
        :
        <div style={{textAlign:"center",margin:"15% auto"}}>
          <progress className="progress w-56"></progress>
        </div>
      }
    </div>
  );
};

export default Traits;
