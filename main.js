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
            result = JSON.parse( app.doShellScript(`curl 'https://astro.kasi.re.kr:444/life/solc?yyyy=${o[0]}&mm=${o[1]}&dd=${o[2]}' -H 'Host: astro.kasi.re.kr:444' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0' -H 'Accept: */*' -H 'Accept-Language: ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3' --compressed -H 'Referer: https://astro.kasi.re.kr:444' -H 'X-Requested-With: XMLHttpRequest' -H 'DNT: 1' -H 'Connection: keep-alive'`) );
            var lunc = `${result.LUNC_YYYY}-${result.LUNC_MM}-${result.LUNC_DD}`;
            app.doShellScript('echo "'+ymd+':'+lunc+'" >> ~/.korean_lunar_calendar');
        } catch(e){}
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
    resolver: function(name, year, md, img) {
        var result = (getSolarDate(year+'-'+md)||'').split('-');
        return {
            name: name.replace(':-', ''),
            year: result[0] || '',
            md: year ? (result[1] + '-' + result[2]) : '',
            img: img
        };
    },
    makeArr: function(str) {
        return (''+str).split('\r').map(function(v){
            var o = v.split('|'), p = {
                name: o[0],
                year: h.currentYear + ((h.datediff(new Date(h.currentYear+'-'+o[1])) > 0) ? 0 : 1),
                md: o[1],
                img: o[2]
            };

            if((/.*:\-\)/).test(p.name)){
                p = h.resolver(p.name, h.currentYear, p.md, p.img);
                h.getRemainDays(p.year+'-'+p.md) <= 0 && (p=h.resolver(p.name, h.currentYear+1, p.md));
            }
            p.after = h.getRemainDays(p.year+'-'+p.md) || '---';
            return p;
        });
    }
};

var birthList = h.makeArr( app.doShellScript("sqlite3 "+path+" \"SELECT ZLASTNAME||ZFIRSTNAME||' (생일)' AS name, strftime('%m-%d',datetime(ZBIRTHDAY+strftime('%s', '2001-01-01 00:00:00'),'unixepoch')) AS md, ZUNIQUEID AS img FROM ZABCDRECORD WHERE ZBIRTHDAY IS NOT NULL\" -separator '|'") );

var annivList = h.makeArr( app.doShellScript("sqlite3 "+path+" \"SELECT r.ZLASTNAME||r.ZFIRSTNAME||' ('|| REPLACE(d.ZLABEL, '_\\$\!<Anniversary>\!\\$_', '기념일')||')' AS name, strftime('%m-%d',datetime(d.ZDATE+strftime('%s', '2001-01-01 00:00:00'),'unixepoch')) AS md, r.ZUNIQUEID AS img FROM ZABCDCONTACTDATE d INNER JOIN ZABCDRECORD r ON d.ZOWNER=r.Z_PK\" -separator '|'") );

var items = [], arr = birthList.concat(annivList).sort(function(a,b){
    if(a.after === b.after) return 0;
    if(a.after < b.after) return -1;
    if(a.after > b.after) return 1;
}).map(function(v){
    items.push({
        icon: {path: v.img ? `${defaultPath.replace('\\','')+subPath}/Images/${(v.img||'').split(":")[0]}` : ''},
        title:`${v.name} - ${v.after+(v.after==='---' ? '' : ('일전'))}`,
        subtitle: `${v.md ? (v.year+'-'+v.md) : '없음'}`
    });
});