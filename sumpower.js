// ver 0.91 6.11.2023 by EVPaddy
var ConfigData = {
    SmartmeterID: [{ name: "shelly.0.SHPLG-S#80646F81DFEE#1.Relay0.Power", desc: 'Bedroom Patrick'},  // Liste der Sensoren und Beschreibung
    { name: "shelly.0.SHPLG-S#80646F81E50A#1.Relay0.Power", desc: 'Guestroom'},
    { name: "shelly.0.SHSW-PM#E09806A9C0D4#1.Relay0.Power", desc: 'Charge Ecoflow'},
    { name: "hass.0.entities.sensor.anti_mosquito_guestroom_power.state", desc: "Anti moquito Guestroom"},
    { name: "hass.0.entities.sensor.muckenschutz_wohnzimmer_current_power.state",desc:"Anti mosquito lr"},
    { name: "hass.0.entities.sensor.anti_moskito_power.state",desc:"Anti mosquito br Patrick"},
    { name: "shelly.1.shellypmmini#348518de57f4#1.PM1:0.Power", desc: "Heating"},
    { name: "shelly.1.shellypmmini#348518e092e8#1.PM1:0.Power", desc: "Server"},
    { name: "shelly.1.shelly1pmmini#348518e05eb8#1.Relay0.Power", desc:"Starlink"},
    { name: "shelly.1.shelly1pmmini#348518e04d7c#1.Relay0.Power", desc: 'Electronics lr'},
    { name: "hass.0.entities.sensor.all_lights_power.state", desc: 'all lights'}],
    SolarSystem: [ { name: "solax.0.data.acpower", desc: "Solax"},
    { name: "shelly.0.SHPLG-S#C8C9A3B8F93A#1.Relay0.Power", desc: "Yusun"}, 
    { name: "hass.0.entities.sensor.wifi_plug_power.state", desc: "Grid Tie Inverter"}], // 2 Solarsysteme
    RunEvery: 4,                                         // Alle x Sekunden ausführen
    FeedInMaxNow: false,                                 // Jetzt einspeisen was geht, z.B. weil Herd an ist
    BasePower: 165,                                      //wird zum gemessenen Verbrauch hinzugerechnet
    Extra: 0,                                            // wird am Ende dazugezählt (auch wenn eigentlich Einspeisung 0)
    DeviceToSwitch: "shelly.0.SHSW-PM#E09806A9C0D4#1.Relay0.Switch",           // device to switch on when there is excess of solar power
    DescDeviceToSwitch: 'Ecoflow',                		// description of device to switch
    SolarExcessOffset : 25,                                // this much excess is needed to first switch device on
    Keepon : false,                                     // keep switch on if PV is generating enough energy(not sure this works)
    EnableSwitching: false,                             // soll das device überhaupt geswitched werden
    SolarChargeWatts: 200,                              // über solar lade x watt
    ACChargeWatts: 800,                                 // über AC y watt laden
    SetWattsProperty: '0_userdata.0.ecoflow.app__thing_property_set.writeables.slowChgWatts', // hier wird der watt wert gesetzt
    MaxPower: 800,                                      //Der höchst mögliche wert in Watt für die Einspeiseleistung
    statesPrefix: "0_userdata.0.sumpower",               //Hier werden meine States angelegt
    ecostatesOutput: "0_userdata.0.ecoflow.app_device_property_.data.InverterHeartbeat.invOutputWatts", // hier wird Einspeisung gelesen
    ecostatesSetAC: "0_userdata.0.ecoflow.app__thing_property_set.writeables.SetAC", // hier wird Einspeisung gesetzt 
    ecostateRegulate: "0_userdata.0.ecoflow.Regulate", // Waly_de's Script ein/ausschalten
    ecostatesSetprio: "0_userdata.0.ecoflow.app__thing_property_set.writeables.SetPrio", // set prio einspeisung oder storage
    DoSleepFrom: 1,                                     // nix tun von 
    DoSleepTo: 7,                                       // bis
    Wmore: 10,                                          // ignoriere +10W Verbrauch
    Wless: -5,                                          // ignoriere bis -5W Verbrauch (damit nicht dauernd neue Werte gesetzt werden)
    MinValueMin: 0,
    AddToBaseloads: [
    { AddToBaseloadFrom: "20", AddToBaseloadTo: "0", AddToBaseLoad: "60"}, // zu verschiedenen Zeiten können verschiedene Werte zusätzlich eingespeist werden
    { AddToBaseloadFrom: "0", AddToBaseloadTo: "1", AddToBaseLoad: "60"},
    { AddToBaseloadFrom: "1", AddToBaseloadTo: "20", AddToBaseLoad: "0"}],
    Debug: false
};

//objekte initialisieren oder erstellen

initMyObject (".MinValueMin", ConfigData.MinValueMin)
initMyObject (".AddtoBaseLoad", 0)
initMyObject (".FeedInMaxNow", ConfigData.FeedInMaxNow)
initMyObject (".BasePower", ConfigData.BasePower)
initMyObject (".Extra", ConfigData.Extra)
initMyObject (".Debug", ConfigData.Debug)
initMyObject (".EnableSwitching", ConfigData.EnableSwitching)
initMyObject (".SolarChargeWatts",ConfigData.SolarChargeWatts)
initMyObject (".DeviceControlled", false)
initMyObject (".ControlScriptDebug", false)

// setState(ConfigData.ecostatesSetprio,0) // make sure regulation is power delivery 
setState(ConfigData.ecostateRegulate,true) // make sure regulate is on 
//setState(ConfigData.SetWattsProperty, ConfigData.ACChargeWatts) // set device to charge off on restart
//setState(ConfigData.DeviceToSwitch,false )
const schedstring = '*/' + ConfigData.RunEvery + ' * * * * *' 
schedule(schedstring, function () {
            CalcPower();
});

//Einspeiseleistung berechnen und bei Änderung setzen
var NewValue = 0
var id = []
var ss = []
var power = 0 
var powerss = 0
var State = false
var pv = 0
var sleeping = false
function CalcPower() {
        const myDate = new Date();
        const myHour = toInt(myDate.getHours().toString().padStart(2, "0"));
        const myMinute = myDate.getMinutes().toString().padStart(2, "0");
        const mySec = myDate.getSeconds().toString().padStart(2, "0");
            let time = ConfigData.statesPrefix + '.Time';
            if (!existsState(time)) {
                createState(time, myHour + ':' + myMinute + ':' + mySec );
            } else {
                setState(time, myHour + ':' + myMinute + ':' + mySec );
            }
        const debug = getState(ConfigData.statesPrefix + '.Debug').val;
       if (myHour > (toInt(ConfigData.DoSleepFrom)-1) && myHour < (toInt(ConfigData.DoSleepTo))) {    // If sleeping, don't feed in anything
        if (sleeping == false) {
            setState(ConfigData.ecostatesSetAC, '0')
            setState(ConfigData.ecostateRegulate,false)
            setState(ConfigData.ecostatesSetprio,'1')
            if (ConfigData.Debug) log ('going to sleep now')
        }
        sleeping = true
        if (ConfigData.Debug) log ('Sleeping until ' + ConfigData.DoSleepTo)        
       } else {
            if (sleeping == true) {
                setState(ConfigData.ecostatesSetprio,'0')
                setState(ConfigData.ecostateRegulate,true)
                if (ConfigData.Debug) log ('waking up now')
            }
            sleeping = false
        }            
        pv = getState('0_userdata.0.ecoflow.totalPV').val
        let baseload = toInt(getState(ConfigData.statesPrefix + '.BasePower').val)
        if (debug) log ("Plugs:")
        for (const xx in ConfigData.SmartmeterID) {
            id[xx] = GetValuePair(ConfigData.SmartmeterID[xx].name,ConfigData.SmartmeterID[xx].desc)
        }
        power=0
        for (const xx in id) {
            power = power + id[xx].devicePower
        //    log (id[xx].deviceDesc + ' ' + id[xx].devicePower + ' '+ power)
        }
         if (debug) log ('Solar systems:')
        for (const systems in ConfigData.SolarSystem) {
            ss[systems] = GetValuePair(ConfigData.SolarSystem[systems].name,ConfigData.SolarSystem[systems].desc)
        }
        powerss=0
        for (const systems in ss) {
            powerss = powerss + ss[systems].devicePower
        }  
         if (debug) {  
        log ('Total power requested by plugs: ' + power.toFixed(2))
        log ("Baseload: " + baseload)
        log ('Total external solar: ' + powerss.toFixed(2))
        log ('Powerstream PV:' + pv )
         }
        let aatbl = ConfigData.statesPrefix + '.AddtoBaseLoad';
        for (const Atbl in ConfigData.AddToBaseloads) {
            if (ConfigData.AddToBaseloads[Atbl].AddToBaseloadTo == 0) {
                ConfigData.AddToBaseloads[Atbl].AddToBaseloadTo = 24
            }
            if (myHour > toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseloadFrom)-1 && myHour < toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseloadTo)) {  
              if (debug) log ("between " + toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseloadFrom) + " and " + toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseloadTo) + " adding to baseload: " + toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseLoad) + " W");
              baseload = baseload + toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseLoad)
              setState(aatbl, toInt(ConfigData.AddToBaseloads[Atbl].AddToBaseLoad));
         } 
        }
        // NewValue =  Math.round(Number((power + baseload - powerss) /10 )) * 10
        NewValue = power + baseload - powerss
       const fimn = getState(ConfigData.statesPrefix + '.FeedInMaxNow').val;
       //log (fimn)
        if (fimn == true) {
             if (debug) log ("Feed in max power is on, feeding in " + ConfigData.MaxPower + ' instead of ' + NewValue )
            NewValue = ConfigData.MaxPower 
        } else {
             if (debug) log ("Current demand: " +  NewValue + ' W');
        }    

        // switch other device
        
        const weSwitch = ConfigData.statesPrefix + '.DeviceControlled'
        const deviceControlledbyUs = getState(ConfigData.statesPrefix + '.DeviceControlled').val
        var es = getState(ConfigData.statesPrefix + '.EnableSwitching').val;
        let localDeviceToSwitch= ConfigData.DeviceToSwitch
            if (localDeviceToSwitch != "") {
            State = getState(localDeviceToSwitch).val
        // if device control is switched off
         if (debug) log ('deviceControlledbyUs:' + deviceControlledbyUs + 'es:' + es)
           if (deviceControlledbyUs == true && es == false) {
                SetChargeWatts(ConfigData.ACChargeWatts,0,true)
                setState(localDeviceToSwitch,false )
                setState(weSwitch,false)
                if (debug) log ('switching device off, setting AC charge')
            }
        if (es == true && sleeping == false) {
            var localSolarChargeWatts = toInt(getState(ConfigData.statesPrefix + ".SolarChargeWatts").val)
            var localSolarExcess = localSolarChargeWatts + ConfigData.SolarExcessOffset
            var localSolarChargeWattsAlreadySet = getState(ConfigData.SetWattsProperty).val
          

            if (NewValue < toFloat(0-localSolarExcess)) {
                if (State == false) {
                 if (debug) log ('Excess big enough, switching device ' + ConfigData.DescDeviceToSwitch + ' on')                
                 setState(localDeviceToSwitch,true)
                 setState(weSwitch, true)
                } else {
                     if (debug) log ('Device ' + ConfigData.DescDeviceToSwitch + ' still on')
                }
            } else { 
                if (State == true ) {
                    if (NewValue > -10) {
                    if (((-1 * pv) <= toFloat(0-localSolarChargeWatts)) && ConfigData.Keepon == true  ) {
                             if (debug) log ('Powerstream macht noch genug, device bleibt an')
                        } else {      
                            SetChargeWatts(ConfigData.ACChargeWatts,0,true)
                            setState(localDeviceToSwitch,false )
                            setState(weSwitch,false)
                             if (debug) log ('Excess too small or no excess, switching device ' +  ConfigData.DescDeviceToSwitch + ' off')
                        }
                    } else { 
                        if (debug) log ('still some excess, keeping device ' +  ConfigData.DescDeviceToSwitch +  ' on')                        
                    }
                } else {
                     if (debug) log ('still not enough power to switch on device ' +  ConfigData.DescDeviceToSwitch )
                }
            }
            }
        }
        SetChargeWatts(localSolarChargeWatts, localSolarChargeWattsAlreadySet,State)
        const extra = toInt(getState(ConfigData.statesPrefix + '.Extra').val)
        if (extra != 0) {
            if (NewValue < 0 ){
                NewValue = extra
            } else
            {
            NewValue = NewValue + extra
            }
            if (debug) log ('Extra: ' + extra)
        }
        const feedinginalradyState = ConfigData.ecostatesOutput;
        let feedInAlready = toInt(getState(feedinginalradyState).val) / 10 

       
        if (feedInAlready > toInt(ConfigData.MaxPower)) {
            feedInAlready = toInt(ConfigData.MaxPower)
        }

        // let feedInAlreadyObject = ConfigData.statesPrefix + '.FeedingInCurrently';

        //    if (!existsState(feedInAlreadyObject)) {
        //        createState(feedInAlreadyObject,feedInAlready);
        //    } else {
        //        setState(feedInAlreadyObject,feedInAlready);
        //    }

        let realPowerState = ConfigData.statesPrefix + '.realPower';
        if (!existsState(realPowerState)) {
            createState(realPowerState, toInt(NewValue));
        } else {
            setState(realPowerState, toInt(NewValue));
        }
        NewValue = NewValue - feedInAlready 

        if (NewValue >ConfigData.Wless && NewValue < ConfigData.Wmore) {NewValue=0}     // ignore Values that are >Wless and < Wmore
        if (debug) log ('Feed in currently ' + feedInAlready + ' W')
        if (debug) log ('demand delta: ' + NewValue + 'W')   

        //if (sleeping) {
        //    if (ConfigData.Debug) log ('Sleeping until ' + ConfigData.DoSleepTo)
        //    NewValue = -feedInAlready
        //} 
        let totalPowerState = ConfigData.statesPrefix + '.totalPower';
        if (!existsState(totalPowerState)) {
            createState(totalPowerState, toInt(NewValue));
        } else {
            setState(totalPowerState, toInt(NewValue));
        
        }        
    }   


 function GetValuePair(deviceunit,devicedescription) {
     const debug = getState(ConfigData.statesPrefix + '.Debug').val   
     var devicePower = 0
     var deviceDesc = "unknown"
             if (getState(deviceunit).val != null) {
                var devicePower = toFloat(getState(deviceunit).val)
            }
            if (devicedescription != null) {
                deviceDesc = devicedescription
            }
            //let deviceState = ConfigData.statesPrefix + '.' + devicedescription+ "Power"; // die werte in objects speichern
            //if (!existsState(deviceState)) {
            //    createState(deviceState, devicePower);
            //} else {
            //    setState(deviceState, devicePower);
            //}
             if (debug) log (deviceDesc + ": " + devicePower + " W");
return { devicePower, deviceDesc };
}

function initMyObject(myObject, myValue)
{
    let myvar = ConfigData.statesPrefix + myObject 
            if(!existsState(myvar)) {
                createState(myvar, myValue)
            } else {
 //               setState(myvar, myValue)
            }


}

function SetChargeWatts (ChargeWatts, ChargeWattsAlready,State)
{
    const debug = getState(ConfigData.statesPrefix + '.Debug').val;
    if (State == true) {
               if (ChargeWatts != ChargeWattsAlready) {
               if (ConfigData.SetWattsProperty != "" ) {
                   setState(ConfigData.SetWattsProperty, ChargeWatts)
                    if (debug) log ("setteting charge to: " + ChargeWatts)
                }
               }
            } 
}