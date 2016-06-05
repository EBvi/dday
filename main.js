var app = Application.currentApplication();
app.includeStandardAdditions = true;

var defaultPath = '~/Library/Application\\ Support/AddressBook/Sources/',
    subPath = app.doShellScript('echo `/bin/ls -1t '+ defaultPath +' | sed -n 1p`'),
    path = defaultPath + subPath + '/AddressBook-v22.abcddb';

function getSolarDate(ymd) {
    var o = ymd.split('-');

    app.doShellScript('touch ~/.korean_lunar_calendar');
    var lc = app.doShellScript('echo `cat ~/.korean_lunar_calendar | grep \"^'+ymd+'\" | sed -n 1p`'),
        isNew = (!lc ? true : false), result;

    if(isNew) {
        try {
            result = app.doShellScript("curl 'http://astro.kasi.re.kr/Life/Knowledge/solar2lunar/convert_daily_l2s.php' -H 'Host: astro.kasi.re.kr' -H 'Accept-Language: ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3' --compressed -H 'DNT: 1' -H 'Referer: http://astro.kasi.re.kr/Life/Knowledge/solar2lunar/convert_daily_l2s.php' -H 'Connection: keep-alive' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' --data 'lun_year="+o[0]+"&lun_month="+o[1]+"&lun_day="+o[2]+"&yoon=3'").match(/<td width=500>(.*?)<\/td>/)[1].match(/(\d+)/g).join('-');
        } catch(e){}
        app.doShellScript('echo "'+ymd+':'+result+'" >> ~/.korean_lunar_calendar');
    } else {
        result = lc.split(':')[1];
    }
    return result || '';
}

var h = {
    currentYear: new Date().getFullYear(),
    currentTime: new Date().getTime(),
    getRemainDays: function(ymd) { return parseInt(h.datediff(new Date(ymd)) / (24*60*60*1000), 10) + 1; },
    datediff: function(d) { return d.getTime() - h.currentTime; },
    makeArr: function(str) {
        return (''+str).split('\r').map(function(v){
            var o = v.split('|'),
                name = o[0],
                year = h.currentYear + ((h.datediff(new Date(h.currentYear+'-'+o[1])) > 0) ? 0 : 1),
                md = o[1];

            if((/.*:\-\)/).test(name)){
                var result = (getSolarDate(year+'-'+md)||'').split('-');
                name = name.replace(':-', '');
                year = result[0] || '';
                md = year ? (result[1] + '-' + result[2]) : '';
            }
            return {name:name, y:year, md:md, after: h.getRemainDays(year+'-'+md) || '---' };
        });
    }
};

var birthList = h.makeArr( app.doShellScript("sqlite3 "+path+" \"SELECT ZLASTNAME||ZFIRSTNAME||' (생일)' AS name, strftime('%m-%d',datetime(ZBIRTHDAY+strftime('%s', '2001-01-01 00:00:00'),'unixepoch')) AS md FROM ZABCDRECORD WHERE ZBIRTHDAY IS NOT NULL\" -separator '|'") );

var annivList = h.makeArr( app.doShellScript("sqlite3 "+path+" \"SELECT r.ZLASTNAME||r.ZFIRSTNAME||' ('|| REPLACE(d.ZLABEL, '_\\$\!<Anniversary>\!\\$_', '기념일')||')' AS name, strftime('%m-%d',datetime(d.ZDATE+strftime('%s', '2001-01-01 00:00:00'),'unixepoch')) AS md FROM ZABCDCONTACTDATE d INNER JOIN ZABCDRECORD r ON d.ZOWNER=r.Z_PK\" -separator '|'") );

var items = [], arr = birthList.concat(annivList).sort(function(a,b){
    if(a.after === b.after) return 0;
    if(a.after < b.after) return -1;
    if(a.after > b.after) return 1;
}).map(function(v){
    items.push({
        title:`${v.name} - ${v.after+(v.after==='---' ? '' : ('일 남음'))} (${v.md ? v.md : '없음'})`
    });
});