def tpls(text):
    out=[];i=0
    while True:
        i=text.find('{{',i)
        if i<0:break
        d=0;j=i
        while j<len(text):
            if text.startswith('{{',j): d+=1;j+=2
            elif text.startswith('}}',j):
                d-=1;j+=2
                if d==0:break
            else:j+=1
        body=text[i+2:j-2]
        # split on top-level pipes
        parts=[];buf='';dd=0;k=0
        while k<len(body):
            if body.startswith('{{',k) or body.startswith('[[',k): dd+=1;buf+=body[k:k+2];k+=2;continue
            if body.startswith('}}',k) or body.startswith(']]',k): dd-=1;buf+=body[k:k+2];k+=2;continue
            if body[k]=='|' and dd==0: parts.append(buf);buf='';k+=1;continue
            buf+=body[k];k+=1
        parts.append(buf)
        name=parts[0].strip();kv={}
        for p in parts[1:]:
            if '=' in p:a,v=p.split('=',1);kv[a.strip()]=v.strip()
        out.append((name,kv,i));i=j
    return out
