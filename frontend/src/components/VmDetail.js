import "./VmDetail.css";

export const VmDetail = (props) => {
  const ipAddress = props.details ? props.details["publicIpAddress"] : "";
  return (
    <>
      <ul>
        <li>IP: {ipAddress}</li>
        <li>SSH / RDP links</li>
        <li>Terminate instance</li>
        <li>uptime and cost</li>
        <li>Auto shutdown (y/n)</li>
        <li>
          Try me: <a href={`http://${ipAddress}:19078`}>Hello World</a>
        </li>
      </ul>
    </>
  );
};
