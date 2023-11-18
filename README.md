# sumpower
Emulate a powermeter to use with the dynamic feed in script by waly_de   
For the EcoFlow Powerstream   

Variables:  
**SmartmeterID**: array of objects that measure power usage and the description of the device  
**SolarSystem**: array of objects that represent additional solar systems and descpription.   
**RunEvery**: run script every x seconds  
**FeedInMaxNow**: if true, export maximum possible energy to grid  
**BasePower**: base consumption of your household (everything that is not connected to a measuring device)  
**Extra**: 0 extra to feed in, even if other solar systems deliver enough power for base power and what smart meters report  
**MaxPower**: max power the inverter can deliver  
**statesPrefix**: where to store the exposed objects  
**ecostatesOutput**: where to read export to grid from powerstream   
**Wmore**: ignore up to Wmore watts of demand  
**Wless**: ignore up to Wless less demand (normally negative) - those two variables are meant to reduce the number of changes to the feed in  
**MinValueMin**: Object exposed to Waly_de's script (so you can set it here)  
**AddToBaseloads**: array of from-to hours with additional load (so you can add a value to the base load i.E at night). Does not take change of day into   account, if day changes, make 2 entries one to 0 hours and a next one from 0 hours (like in the script)  
**Debug**: log debug messages if true  
  
The interesting/important variables are exposed as objects in the 'statesPrefix' tree so you can read/change them externally  
They now survive a restart of the script. 
I completely revamped the script, it now only does the powermeter emulation. All other funcitons have been moved into other scripts. 
