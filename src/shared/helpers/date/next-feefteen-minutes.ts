// Calculate the next 15-minute interval from the current time

export const getNextFifteenMinuteInterval = (): Date => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;

  const result = new Date(now);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);

  // If we rounded to 60 minutes, we need to add an hour and set minutes to 0
  if (roundedMinutes === 60) {
    result.setHours(result.getHours() + 1);
    result.setMinutes(0);
  }

  console.log('result: ', result);
  return result;
};
