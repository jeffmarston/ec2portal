export const initializeValueMaps = () => {
  const initialize = async () => {
    const response = await fetch(`${process.env.REACT_APP_APIURL}/metadata`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    valueMap.images = [{ imageId: "", name: "", os: "" }];
    valueMap.images.push(...(await response.json()));
  };

  initialize();

  return;
};

const convertToLocal = (utcHour) => {
  const date = new Date();
  date.setUTCHours(utcHour);
  date.setUTCMinutes(0);
  const localTimeString = date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "short",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    formatTimezone: (abbreviation) => `(${abbreviation})`,
  });
  return localTimeString;
};

export const valueMap = {
  images: [],

  instanceTypes: [
    { value: "t2.micro", label: "t2.micro" },
    { value: "t2.large", label: "t2.large" },
    { value: "t2.xlarge", label: "t2.xlarge" },
    { value: "t2.2xlarge", label: "t2.2xlarge" },
  ],

  autoShutdownHours: [
    { value: "-1", label: "none" },
    { value: "21", label: convertToLocal(21) },
    { value: "2", label: convertToLocal(2) },
    { value: "4", label: convertToLocal(4) },
    { value: "16", label: convertToLocal(16) },
  ],
};
