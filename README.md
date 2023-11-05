# sumpower
Emulate a powermeter to use with the dynamic feed in script by waly_de (and some more functions)  
For the EcoFlow Powerstream   

Variables:  
**SmartmeterID**: array of objects that measure power usage and the description of the device  
**SolarSystem**: array of objects that represent additional solar systems and descpription.   
**RunEvery**: run script every x seconds  
**FeedInMaxNow**: if true, export maximum possible energy to grid  
**BasePower**: base consumption of your household (everything that is not connected to a measuring device)  
**Extra**: 0 extra to feed in, even if other solar systems deliver enough power for base power and what smart meters report  
**DeviceToSwitch**: object to switch on (set true)  
**DescDeviceToSwitch**: description of that object  
**SolarExcessOffset**: excess needed in addition to **SolarChargeWatts** Once the device is on, it stays on as long as there is more excess.   
**Keepon**: if true, keep it on when Powerstream generates enough power, but the excess of other solar systems isn't enough    
**EnableSwitching**: device is only switched on/off when thi is true  
**SolarChargeWatts**: set SetWattsProperty to x (to charge i.E. Ecoflow battery with x watts when charged by solar excess  
**ACChargeWatts**: when not charging by script/solar excess, set charging speed to this  
**SetWattsProperty**: object where the charging speed is stored  
**MaxPower**: max power the inverter can deliver  
**statesPrefix**: where to store the exposed objects  
**ecostatesOutput**: where to read export to grid from powerstream  
**ecostatesSetAC**: Where to control AC feed in
**ecostateRegulate**: Control Waly_de's script
**ecostatesSetprio**: Object that controls feed in prio (0) or storage prio (1) 
**DoSleepFrom**: sleep from hour of day  
**DoSleepTo**: sleep to hour of day  
**Wmore**: ignore up to Wmore watts of demand  
**Wless**: ignore up to Wless less demand (normally negative) - those two variables are meant to reduce the number of changes to the feed in  
**MinValueMin**: Object exposed to Waly_de's script (so you can set it here)  
**AddToBaseloads**: array of from-to hours with additional load (so you can add a value to the base load i.E at night). Does not take change of day into   account, if day changes, make 2 entries one to 0 hours and a next one from 0 hours (like in the script)  
**Debug**: log debug messages if true  
  
The interesting/important variables are exposed as objects in the 'statesPrefix' tree so you can read/change them externally  
They now survive a restart of the script. 
I changed the behaviour of 'sleep'. The script doesn't really sleep anymore, just sets feed in of Powerstream to 0 and disables control. 
Because if the script would really be sleeping the feed in script couldn't make a proper history of lowest/average energy usage.
